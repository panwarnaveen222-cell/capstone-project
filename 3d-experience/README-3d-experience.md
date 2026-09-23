## Your First 3D Experience on the Web

A small product configurator (`3d-experience/index.html`), built with Three.js loaded as ES modules from a CDN, no bundler. A procedurally-generated desk lamp — every shape is built at runtime from primitives (cylinder, sphere, cone), so there's no `.glb` model to download at all.

### What it does
- **Orbit and zoom** the lamp (mouse drag, or touch drag/pinch on mobile).
- **Change the shade colour** (5 swatches).
- **Swap the shade shape** (dome / cone / cylinder) — a real part swap, not just a colour change: the mesh's geometry is replaced and the old one disposed.
- **Toggle a metallic vs matte base finish.**
- **Toggle auto-rotate and wireframe.**

### Interaction beyond orbiting
The colour swatches and shape buttons directly satisfy the "beyond orbiting" requirement — swapping the shade geometry at runtime is the "swap a part" option from the brief.

### Loads responsibly
- **No model file at all**, so there's nothing to compress or stream — this was a deliberate choice over shipping a `.glb`, and it's the biggest perf win available for a small product viewer.
- **Lazy start:** the WebGL context and Three.js scene aren't created until an `IntersectionObserver` confirms the stage is actually visible, then it waits for `requestIdleCallback` before starting, so the 3D work never blocks the initial page paint.
- **Device pixel ratio capped at 1.75.**
- **Fully pauses (not just skips frames)** when the browser tab is hidden, by not calling `requestAnimationFrame` at all while hidden.
- **`prefers-reduced-motion`:** the scene never auto-starts. A static fallback screen shows instead, with an explicit "Enable the 3D scene anyway" button, so the person controls the motion themselves.

### Mobile
`OrbitControls`' built-in touch support (`touch-action: none` on the canvas) handles one-finger drag to orbit and pinch to zoom. The panel below the stage stacks under it instead of beside it below a 56rem breakpoint, so it's usable on a phone without horizontal scrolling.

### Perf note (FE-10 lens)
- **Bundle cost:** Three.js core (`three.module.js`) is the only real dependency, loaded from a CDN and cached across visits; there's no bundler step in this deliverable, so there's no tree-shaking, but the module is only pulled in after the lazy-load gate. `OrbitControls` is a small additional module.
- **Frame rate:** a live FPS counter (top-right of the scene) reads from the actual render loop, so it's not a claimed number — on a mid-range laptop it holds close to display refresh rate, since the scene is a handful of primitives with one shadow-casting light, not a dense model.
- **What I'd change with more time:** add a real `.glb` product (DRACO-compressed) as an optional "load your own model" path, since a procedural shape is the cheapest possible scene and isn't representative of a heavier real product.

### Run locally
Open `3d-experience/index.html` in a browser. It fetches Three.js from a CDN, so it needs an internet connection; there's no local build step.

### Deploy (GitHub Pages)
Same repo, same Pages setup as the earlier assignments. Live at `https://<username>.github.io/<repo>/3d-experience/`.
