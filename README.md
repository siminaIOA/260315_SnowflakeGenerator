# 260315_SnowflakeGenerator

A parametric fractal snowflake generator built with Three.js. Generate unique 3D snowflakes by tweaking fractal depth, symmetry, branching angles, extrusion profiles, spike tracers, and material properties -- all in real-time through an interactive slider UI. Features include radial depth gradient extrusion, color gradients from center to tips, iridescence, preset configurations, background snowfall particles, and a growth animation that builds the snowflake outward from the center.

**[Live Demo](https://siminaioa.github.io/260315_SnowflakeGenerator/)**

## Features

- Recursive fractal branching with configurable depth, symmetry, angles, decay, and density
- Secondary branching angle for alternating sub-branches
- Asymmetry slider to break perfect symmetry for a natural look
- Branch profile control blending rectangular to rounded cross-sections
- Radial extrusion gradient -- thick at the center plate, paper-thin at the tips (cubic falloff curve)
- Segmented branches (5 segments each) for smooth per-branch depth tapering
- Adjustable center plate size and depth with proper hexagonal geometry
- Beveled extrusion edges for soft light catches
- Spike (tracer) system with density, scale, length, offset, taper, and flip controls
- Color gradient from center to tips with two color pickers and power-curve blending
- Iridescence with adjustable IOR for rainbow light refraction
- MeshPhysicalMaterial with clearcoat, transmission, glow, and environment reflections
- Procedural PMREM environment map for realistic reflections
- ACES Filmic tone mapping for cinematic brightness
- Built-in presets: Classic, Dense Crystal, Minimal, Fern-like
- Growth animation button to watch the snowflake build branch by branch
- Background snowfall particles (600 drifting particles)
- Turntable auto-rotation with toggle checkbox
- Randomize All and Randomize Spikes buttons
- OrbitControls for free 3D rotation and zoom
- Mesh count safety cap (8000) to prevent browser freezes

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/siminaIOA/260315_SnowflakeGenerator.git
   cd 260315_SnowflakeGenerator
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open `http://localhost:5173/` in your browser.

## Controls

- **Preset dropdown** -- switch between Classic, Dense Crystal, Minimal, Fern-like
- **Fractal folder** -- Depth, Symmetry, Length, Thickness, Angle, Angle 2, Decay, Falloff, Jitter, Density, Tip, Branch Depth, Plate Depth, Plate Size, Profile (Round), Asymmetry
- **Spikes (Tracers) folder** -- Density, Scale, Length, Offset, Taper, Flip, Rotate toggle
- **Material folder** -- Color, Tip Color, Color Gradient, Metalness, Roughness, Clearcoat, CC Roughness, IOR, Glow, Iridescence, Irid. IOR
- **Growth Animation** -- click to watch the snowflake grow from center outward
- **Randomize All / Randomize Spikes** -- generate random configurations
- **Mouse** -- left-drag to orbit, scroll to zoom, right-drag to pan

## Deployment

### Build locally

```
npm run build
```

This produces a `dist/` folder with the production-ready site.

### Deploy to GitHub Pages

1. Build with relative paths:
   ```
   npx vite build --base=./
   ```
2. Create an orphan `gh-pages` branch from the `dist/` output and push it, or use any static deploy tool of your choice.
3. In the GitHub repo, go to **Settings > Pages** and set the source to **Deploy from a branch** → `gh-pages` / `/ (root)`.
4. The site will be live at: **https://siminaioa.github.io/260315_SnowflakeGenerator/**
