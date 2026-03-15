import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { params, setupGUI } from './params.js';
import { generateSnowflake } from './snowflake.js';
import { createSnowfall, updateSnowfall } from './snowfall.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080818);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

function buildEnvMap() {
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xddeeff, side: THREE.BackSide })
  ));
  for (const s of [
    { pos: [4, 5, 3], color: 0xffffff, intensity: 6 },
    { pos: [-3, -2, -4], color: 0xaabbff, intensity: 3 },
    { pos: [0, 3, -5], color: 0xccddff, intensity: 2 },
  ]) {
    const l = new THREE.PointLight(s.color, s.intensity, 30);
    l.position.set(...s.pos);
    envScene.add(l);
  }
  const rt = pmremGenerator.fromScene(envScene, 0.02);
  envScene.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
  return rt.texture;
}

const envMap = buildEnvMap();
scene.environment = envMap;

scene.add(new THREE.AmbientLight(0xddeeff, 1.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xaaccff, 1.0);
fillLight.position.set(-3, -1, 2);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xbbddff, 0.8);
rimLight.position.set(0, -2, -5);
scene.add(rimLight);

createSnowfall(scene);

const baseColor = new THREE.Color();
const tipColor = new THREE.Color();

function makeMaterialForRatio(ratio) {
  baseColor.set(params.material.color);
  tipColor.set(params.material.tipColor);
  const gradientAmt = params.material.colorGradient;
  const t = Math.pow(Math.min(ratio, 1), 0.6);
  const blended = baseColor.clone().lerp(tipColor, t * gradientAmt);

  return new THREE.MeshPhysicalMaterial({
    color: blended,
    metalness: params.material.metalness,
    roughness: params.material.roughness,
    clearcoat: params.material.clearcoat,
    clearcoatRoughness: params.material.clearcoatRoughness,
    transmission: 1.0,
    ior: params.material.ior,
    thickness: 0.8,
    emissive: blended,
    emissiveIntensity: params.material.emissiveIntensity,
    side: THREE.DoubleSide,
    envMap: envMap,
    envMapIntensity: 1.5,
    iridescence: params.material.iridescence,
    iridescenceIOR: params.material.iridescenceIOR,
  });
}

const materialCache = new Map();

function getMaterial(ratio) {
  const bucket = Math.round(ratio * 50) / 50;
  if (!materialCache.has(bucket)) {
    materialCache.set(bucket, makeMaterialForRatio(bucket));
  }
  return materialCache.get(bucket);
}

function clearMaterialCache() {
  materialCache.forEach(m => m.dispose());
  materialCache.clear();
}

let snowflakeGroup = null;

function assignMaterials(group) {
  group.traverse((child) => {
    if (child.isMesh) {
      const r = child.userData.distRatio || 0;
      child.material = getMaterial(r);
    }
  });
}

function rebuildSnowflake() {
  if (growthAnimId !== null) {
    cancelAnimationFrame(growthAnimId);
    growthAnimId = null;
  }

  if (snowflakeGroup) {
    snowflakeGroup.traverse(c => { if (c.geometry) c.geometry.dispose(); });
    scene.remove(snowflakeGroup);
  }

  clearMaterialCache();
  snowflakeGroup = generateSnowflake(params);
  assignMaterials(snowflakeGroup);
  scene.add(snowflakeGroup);
}

function updateMaterial() {
  clearMaterialCache();
  if (snowflakeGroup) assignMaterials(snowflakeGroup);
}

function toggleRotate(val) {
  controls.autoRotate = val;
}

let growthAnimId = null;

function startGrowthAnimation() {
  if (growthAnimId !== null) {
    cancelAnimationFrame(growthAnimId);
    growthAnimId = null;
  }

  if (snowflakeGroup) {
    snowflakeGroup.traverse(c => { if (c.geometry) c.geometry.dispose(); });
    scene.remove(snowflakeGroup);
  }

  clearMaterialCache();
  snowflakeGroup = generateSnowflake(params);
  assignMaterials(snowflakeGroup);

  const allMeshes = [];
  snowflakeGroup.traverse(c => { if (c.isMesh) allMeshes.push(c); });

  allMeshes.sort((a, b) => (a.userData.distRatio || 0) - (b.userData.distRatio || 0));
  allMeshes.forEach(m => { m.visible = false; });

  scene.add(snowflakeGroup);

  let idx = 0;
  const perFrame = Math.max(1, Math.floor(allMeshes.length / 120));

  function step() {
    for (let i = 0; i < perFrame && idx < allMeshes.length; i++, idx++) {
      allMeshes[idx].visible = true;
    }
    if (idx < allMeshes.length) {
      growthAnimId = requestAnimationFrame(step);
    } else {
      growthAnimId = null;
    }
  }
  growthAnimId = requestAnimationFrame(step);
}

rebuildSnowflake();
setupGUI(rebuildSnowflake, updateMaterial, toggleRotate, startGrowthAnimation);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  controls.update();
  updateSnowfall();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
