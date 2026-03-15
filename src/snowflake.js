import * as THREE from 'three';

function makeExtrudeSettings(depth) {
  return {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.15,
    bevelSize: depth * 0.08,
    bevelSegments: 1,
  };
}

function createSegmentShape(length, widthStart, widthEnd, profile) {
  const shape = new THREE.Shape();
  const h0 = widthStart / 2;
  const h1 = widthEnd / 2;

  if (profile <= 0) {
    shape.moveTo(0, -h0);
    shape.lineTo(length, -h1);
    shape.lineTo(length, h1);
    shape.lineTo(0, h0);
  } else {
    const steps = 6;
    shape.moveTo(0, -h0);
    shape.lineTo(length, -h1);
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI * (i / steps) - Math.PI / 2;
      const cx = length;
      const r = h1 * profile;
      const flatH = h1 * (1 - profile);
      const py = Math.sin(a) * r + (a < 0 ? -flatH : flatH);
      if (i === 0) continue;
      shape.lineTo(cx, py);
    }
    shape.lineTo(0, h0);
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI / 2 - Math.PI * (i / steps);
      const r = h0 * profile;
      const flatH = h0 * (1 - profile);
      const py = Math.sin(a) * r + (a > 0 ? flatH : -flatH);
      if (i === 0) continue;
      shape.lineTo(0, py);
    }
  }
  shape.closePath();
  return shape;
}

function createHexShape(size) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(a) * size;
    const y = Math.sin(a) * size;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function createSpikeShape(length, baseWidth, taper) {
  const tipWidth = baseWidth * (1 - taper);
  const shape = new THREE.Shape();
  shape.moveTo(0, -baseWidth / 2);
  shape.lineTo(length, -tipWidth / 2);
  shape.lineTo(length, tipWidth / 2);
  shape.lineTo(0, baseWidth / 2);
  shape.closePath();
  return shape;
}

const MAX_MESHES = 8000;
let meshCount = 0;
const MIN_EXT_RATIO = 0.005;
const SEGMENTS_PER_BRANCH = 5;

function extAtDist(branchExtrude, dist, maxRadius) {
  if (maxRadius <= 0) return branchExtrude;
  const t = Math.min(dist / maxRadius, 1);
  const curve = t * t * t;
  return branchExtrude * (1 - curve * (1 - MIN_EXT_RATIO));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function buildSegmentedBranch(group, branchLength, thicknessBase, thicknessTip, branchExtrude, distFromCenter, maxRadius, profile, distInfo) {
  const n = SEGMENTS_PER_BRANCH;
  const segLen = branchLength / n;

  for (let s = 0; s < n; s++) {
    if (meshCount >= MAX_MESHES) return;

    const t0 = s / n;
    const t1 = (s + 1) / n;
    const w0 = lerp(thicknessBase, thicknessTip, t0);
    const w1 = lerp(thicknessBase, thicknessTip, t1);

    const d0 = distFromCenter + branchLength * t0;
    const d1 = distFromCenter + branchLength * t1;
    const ext = (extAtDist(branchExtrude, d0, maxRadius) + extAtDist(branchExtrude, d1, maxRadius)) / 2;

    const shape = createSegmentShape(segLen, w0, w1, profile);
    const geo = new THREE.ExtrudeGeometry(shape, makeExtrudeSettings(ext));
    geo.translate(0, 0, -ext / 2);

    const midDist = (d0 + d1) / 2;
    const mesh = new THREE.Mesh(geo);
    mesh.position.set(segLen * s, 0, 0);
    mesh.userData.distRatio = maxRadius > 0 ? midDist / maxRadius : 0;
    group.add(mesh);
    meshCount++;
  }
}

function addSpikesToBranch(group, branchLength, thickness, spikeParams, branchExtrude, distFromCenter, maxRadius) {
  if (spikeParams.density <= 0) return;

  const step = branchLength / (spikeParams.density + 1);
  const baseWidth = thickness * spikeParams.scale;
  const sLen = branchLength * spikeParams.length * spikeParams.scale;

  for (let i = 1; i <= spikeParams.density; i++) {
    const pos = step * i + (spikeParams.offset - 0.5) * step;
    if (pos < 0 || pos > branchLength) continue;

    const midDist = distFromCenter + pos + sLen * 0.5;
    const ext = extAtDist(branchExtrude, midDist, maxRadius);

    const shape = createSpikeShape(sLen, baseWidth, spikeParams.taper);
    const geo = new THREE.ExtrudeGeometry(shape, makeExtrudeSettings(ext));
    geo.translate(0, 0, -ext / 2);

    const directions = spikeParams.flip ? [1, -1] : [1];
    for (const dir of directions) {
      if (meshCount >= MAX_MESHES) return;
      const mesh = new THREE.Mesh(geo);
      mesh.position.set(pos, 0, 0);
      mesh.rotation.z = dir * Math.PI / 3;
      mesh.userData.distRatio = maxRadius > 0 ? midDist / maxRadius : 0;
      group.add(mesh);
      meshCount++;
    }
  }
}

function buildBranch(p, depth, currentLength, currentThickness, spikeParams, distFromCenter, maxRadius, branchIndex) {
  const group = new THREE.Group();

  if (depth <= 0 || currentLength < 0.005 || meshCount >= MAX_MESHES) return group;

  const tipThickness = currentThickness * p.falloff;

  buildSegmentedBranch(group, currentLength, currentThickness, tipThickness, p.branchExtrude, distFromCenter, maxRadius, p.profile);

  addSpikesToBranch(group, currentLength, currentThickness, spikeParams, p.branchExtrude, distFromCenter, maxRadius);

  if (p.tip > 0 && depth === 1) {
    const tipDist = distFromCenter + currentLength;
    const tipExt = extAtDist(p.branchExtrude, tipDist, maxRadius);
    const tipShape = createHexShape(p.tip * currentThickness * 2);
    const tipGeo = new THREE.ExtrudeGeometry(tipShape, makeExtrudeSettings(tipExt));
    tipGeo.translate(0, 0, -tipExt / 2);
    const tipMesh = new THREE.Mesh(tipGeo);
    tipMesh.position.set(currentLength, 0, 0);
    tipMesh.userData.distRatio = maxRadius > 0 ? tipDist / maxRadius : 0;
    group.add(tipMesh);
    meshCount++;
  }

  if (depth > 1) {
    const nextLength = currentLength * p.decay;
    const nextThickness = currentThickness * p.falloff;
    const angleRad1 = (p.angle * Math.PI) / 180;
    const angleRad2 = (p.angle2 * Math.PI) / 180;

    for (let d = 0; d < p.density; d++) {
      const fraction = (d + 1) / (p.density + 1);
      const branchPoint = currentLength * fraction;
      const childDist = distFromCenter + branchPoint;
      const jitterAngle = (Math.random() - 0.5) * p.jitter * angleRad1;
      const useAngle = (d % 2 === 0) ? angleRad1 : angleRad2;

      const asymOff = p.asymmetry * (Math.random() - 0.5) * useAngle;

      for (const sign of [1, -1]) {
        const child = buildBranch(p, depth - 1, nextLength, nextThickness, spikeParams, childDist, maxRadius, d);
        child.position.set(branchPoint, 0, 0);
        child.rotation.z = sign * useAngle + jitterAngle + asymOff * sign;
        group.add(child);
      }
    }
  }

  return group;
}

function computeMaxRadius(p) {
  const armStart = p.plate * 0.85 - p.plate * 0.15;
  let r = armStart;
  let len = p.length + p.plate * 0.15;
  for (let d = p.depth; d >= 1; d--) {
    r += len;
    len = len * p.decay;
  }
  return r;
}

function createPlate(size, extDepth) {
  if (size <= 0) return null;
  const shape = createHexShape(size);
  const geo = new THREE.ExtrudeGeometry(shape, makeExtrudeSettings(extDepth));
  geo.translate(0, 0, -extDepth / 2);
  const mesh = new THREE.Mesh(geo);
  mesh.userData.distRatio = 0;
  return mesh;
}

export function generateSnowflake(params) {
  meshCount = 0;
  const root = new THREE.Group();
  const maxRadius = computeMaxRadius(params);

  const plate = createPlate(params.plate, params.plateExtrude);
  if (plate) root.add(plate);

  const armAngle = (2 * Math.PI) / params.symmetry;
  const plateEdge = params.plate * 0.85;
  const overlap = params.plate * 0.15;
  const armStart = plateEdge - overlap;

  for (let i = 0; i < params.symmetry; i++) {
    const armAsym = params.asymmetry * (Math.random() - 0.5) * 0.15;

    const arm = buildBranch(
      params,
      params.depth,
      params.length * (1 + armAsym) + overlap,
      params.thickness,
      params.spikes,
      armStart,
      maxRadius,
      i
    );
    arm.rotation.z = armAngle * i;
    arm.position.set(
      Math.cos(armAngle * i) * armStart,
      Math.sin(armAngle * i) * armStart,
      0
    );
    root.add(arm);
  }

  return root;
}
