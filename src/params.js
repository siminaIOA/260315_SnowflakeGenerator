import GUI from 'lil-gui';

export const params = {
  depth: 3,
  symmetry: 6,
  length: 2.0,
  thickness: 0.08,
  angle: 45,
  angle2: 30,
  decay: 0.55,
  falloff: 0.6,
  jitter: 0.0,
  density: 2,
  plate: 0.3,
  tip: 0.15,
  branchExtrude: 0.06,
  plateExtrude: 0.1,
  profile: 0.0,
  asymmetry: 0.0,

  spikes: {
    density: 3,
    scale: 0.5,
    length: 0.4,
    offset: 0.3,
    taper: 0.5,
    flip: false,
  },

  autoRotate: true,

  material: {
    color: '#ffffff',
    tipColor: '#001dfa',
    colorGradient: 1.0,
    metalness: 0.015,
    roughness: 0.85,
    clearcoat: 0.24,
    clearcoatRoughness: 0.2,
    ior: 1.04,
    emissiveIntensity: 0.08,
    iridescence: 0.71,
    iridescenceIOR: 1.0,
  },
};

const PRESETS = {
  Classic: {
    depth: 3, symmetry: 6, length: 2.0, thickness: 0.08, angle: 45, angle2: 30,
    decay: 0.55, falloff: 0.6, jitter: 0.0, density: 2, plate: 0.3, tip: 0.15,
    branchExtrude: 0.06, plateExtrude: 0.1, profile: 0.0, asymmetry: 0.0,
    spikes: { density: 3, scale: 0.5, length: 0.4, offset: 0.3, taper: 0.5, flip: false },
  },
  'Dense Crystal': {
    depth: 4, symmetry: 6, length: 1.8, thickness: 0.06, angle: 55, angle2: 40,
    decay: 0.5, falloff: 0.55, jitter: 0.1, density: 2, plate: 0.5, tip: 0.1,
    branchExtrude: 0.08, plateExtrude: 0.15, profile: 0.3, asymmetry: 0.0,
    spikes: { density: 4, scale: 0.6, length: 0.3, offset: 0.3, taper: 0.7, flip: true },
  },
  Minimal: {
    depth: 2, symmetry: 6, length: 2.5, thickness: 0.05, angle: 60, angle2: 45,
    decay: 0.5, falloff: 0.5, jitter: 0.0, density: 1, plate: 0.2, tip: 0.0,
    branchExtrude: 0.04, plateExtrude: 0.06, profile: 0.5, asymmetry: 0.0,
    spikes: { density: 0, scale: 0.5, length: 0.4, offset: 0.3, taper: 0.5, flip: false },
  },
  'Fern-like': {
    depth: 4, symmetry: 6, length: 2.2, thickness: 0.04, angle: 35, angle2: 20,
    decay: 0.65, falloff: 0.7, jitter: 0.15, density: 2, plate: 0.15, tip: 0.05,
    branchExtrude: 0.05, plateExtrude: 0.05, profile: 0.7, asymmetry: 0.1,
    spikes: { density: 2, scale: 0.4, length: 0.5, offset: 0.4, taper: 0.8, flip: false },
  },
};

function applyPreset(name, onUpdate, gui) {
  const p = PRESETS[name];
  if (!p) return;
  Object.keys(p).forEach(k => {
    if (k === 'spikes') {
      Object.assign(params.spikes, p.spikes);
    } else {
      params[k] = p[k];
    }
  });
  gui.controllersRecursive().forEach(c => c.updateDisplay());
  onUpdate();
}

export function setupGUI(onUpdate, onMaterialUpdate, onRotateToggle, onGrowth) {
  const gui = new GUI({ title: 'Snowflake' });

  const presetObj = { preset: 'Classic' };
  gui.add(presetObj, 'preset', Object.keys(PRESETS)).name('Preset').onChange(
    v => applyPreset(v, onUpdate, gui)
  );

  const main = gui.addFolder('Fractal');
  main.add(params, 'depth', 1, 5, 1).name('Depth').onChange(onUpdate);
  main.add(params, 'symmetry', 3, 12, 1).name('Symmetry').onChange(onUpdate);
  main.add(params, 'length', 0.5, 5.0, 0.1).name('Length').onChange(onUpdate);
  main.add(params, 'thickness', 0.01, 0.3, 0.005).name('Thickness').onChange(onUpdate);
  main.add(params, 'angle', 10, 80, 1).name('Angle').onChange(onUpdate);
  main.add(params, 'angle2', 5, 80, 1).name('Angle 2').onChange(onUpdate);
  main.add(params, 'decay', 0.1, 0.9, 0.01).name('Decay').onChange(onUpdate);
  main.add(params, 'falloff', 0.1, 1.0, 0.01).name('Falloff').onChange(onUpdate);
  main.add(params, 'jitter', 0.0, 1.0, 0.01).name('Jitter').onChange(onUpdate);
  main.add(params, 'density', 1, 4, 1).name('Density').onChange(onUpdate);
  main.add(params, 'tip', 0.0, 0.7, 0.01).name('Tip').onChange(onUpdate);
  main.add(params, 'branchExtrude', 0.01, 0.4, 0.005).name('Branch Depth').onChange(onUpdate);
  main.add(params, 'plateExtrude', 0.01, 0.5, 0.005).name('Plate Depth').onChange(onUpdate);
  main.add(params, 'plate', 0.0, 1.5, 0.05).name('Plate Size').onChange(onUpdate);
  main.add(params, 'profile', 0.0, 1.0, 0.05).name('Profile (Round)').onChange(onUpdate);
  main.add(params, 'asymmetry', 0.0, 0.5, 0.01).name('Asymmetry').onChange(onUpdate);

  const spikes = gui.addFolder('Spikes (Tracers)');
  spikes.add(params.spikes, 'density', 0, 6, 1).name('Density').onChange(onUpdate);
  spikes.add(params.spikes, 'scale', 0.1, 2.0, 0.05).name('Scale').onChange(onUpdate);
  spikes.add(params.spikes, 'length', 0.05, 1.5, 0.05).name('Length').onChange(onUpdate);
  spikes.add(params.spikes, 'offset', 0.0, 1.0, 0.05).name('Offset').onChange(onUpdate);
  spikes.add(params.spikes, 'taper', 0.0, 1.0, 0.05).name('Taper').onChange(onUpdate);
  spikes.add(params.spikes, 'flip', false).name('Flip').onChange(onUpdate);
  spikes.add(params, 'autoRotate').name('Rotate').onChange(onRotateToggle);

  spikes.add({
    randomize: () => {
      params.spikes.density = Math.floor(Math.random() * 5) + 1;
      params.spikes.scale = 0.2 + Math.random() * 1.0;
      params.spikes.length = 0.1 + Math.random() * 0.8;
      params.spikes.offset = Math.random() * 0.8;
      params.spikes.taper = 0.2 + Math.random() * 0.6;
      params.spikes.flip = Math.random() > 0.5;
      gui.controllersRecursive().forEach(c => c.updateDisplay());
      onUpdate();
    }
  }, 'randomize').name('Randomize Spikes');

  const mat = gui.addFolder('Material');
  mat.addColor(params.material, 'color').name('Color').onChange(onMaterialUpdate);
  mat.addColor(params.material, 'tipColor').name('Tip Color').onChange(onMaterialUpdate);
  mat.add(params.material, 'colorGradient', 0.0, 1.0, 0.01).name('Color Gradient').onChange(onMaterialUpdate);
  mat.add(params.material, 'metalness', 0.0, 0.15, 0.005).name('Metalness').onChange(onMaterialUpdate);
  mat.add(params.material, 'roughness', 0.0, 1.0, 0.01).name('Roughness').onChange(onMaterialUpdate);
  mat.add(params.material, 'clearcoat', 0.0, 1.0, 0.01).name('Clearcoat').onChange(onMaterialUpdate);
  mat.add(params.material, 'clearcoatRoughness', 0.0, 1.0, 0.01).name('CC Roughness').onChange(onMaterialUpdate);
  mat.add(params.material, 'ior', 1.0, 1.4, 0.01).name('IOR').onChange(onMaterialUpdate);
  mat.add(params.material, 'emissiveIntensity', 0.0, 0.15, 0.005).name('Glow').onChange(onMaterialUpdate);
  mat.add(params.material, 'iridescence', 0.0, 1.0, 0.01).name('Iridescence').onChange(onMaterialUpdate);
  mat.add(params.material, 'iridescenceIOR', 1.0, 2.5, 0.01).name('Irid. IOR').onChange(onMaterialUpdate);

  gui.add({ grow: () => onGrowth() }, 'grow').name('Growth Animation');

  gui.add({
    randomize: () => {
      params.depth = Math.floor(Math.random() * 3) + 2;
      params.symmetry = Math.floor(Math.random() * 4) + 5;
      params.length = 1.0 + Math.random() * 2.5;
      params.thickness = 0.03 + Math.random() * 0.12;
      params.angle = 20 + Math.random() * 50;
      params.angle2 = 10 + Math.random() * 50;
      params.decay = 0.35 + Math.random() * 0.35;
      params.falloff = 0.3 + Math.random() * 0.5;
      params.jitter = Math.random() * 0.4;
      params.density = Math.floor(Math.random() * 2) + 1;
      params.plate = 0.1 + Math.random() * 0.6;
      params.tip = Math.random() * 0.3;
      params.profile = Math.random() * 0.8;
      params.asymmetry = Math.random() * 0.2;

      params.spikes.density = Math.floor(Math.random() * 4) + 1;
      params.spikes.scale = 0.2 + Math.random() * 0.8;
      params.spikes.length = 0.1 + Math.random() * 0.6;
      params.spikes.offset = Math.random() * 0.7;
      params.spikes.taper = 0.2 + Math.random() * 0.6;
      params.spikes.flip = Math.random() > 0.5;

      gui.controllersRecursive().forEach(c => c.updateDisplay());
      onUpdate();
    }
  }, 'randomize').name('Randomize All');

  return gui;
}
