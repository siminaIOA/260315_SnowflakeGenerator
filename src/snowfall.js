import * as THREE from 'three';

const COUNT = 600;
const SPREAD = 20;
const HEIGHT = 15;

let points;
const velocities = [];

export function createSnowfall(scene) {
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 1] = (Math.random() - 0.5) * HEIGHT;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    velocities.push({
      x: (Math.random() - 0.5) * 0.002,
      y: -0.005 - Math.random() * 0.01,
      z: (Math.random() - 0.5) * 0.002,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.04,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true,
  });

  points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

export function updateSnowfall() {
  if (!points) return;
  const pos = points.geometry.attributes.position.array;
  for (let i = 0; i < COUNT; i++) {
    const v = velocities[i];
    pos[i * 3] += v.x;
    pos[i * 3 + 1] += v.y;
    pos[i * 3 + 2] += v.z;

    if (pos[i * 3 + 1] < -HEIGHT / 2) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = HEIGHT / 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    }
  }
  points.geometry.attributes.position.needsUpdate = true;
}
