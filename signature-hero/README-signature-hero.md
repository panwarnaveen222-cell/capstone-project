## Signature Hero: A Fullscreen Shader

A hand-written WebGL fragment shader (`signature-hero/index.html`, plain JS, no build step, no 3D library) rendered fullscreen behind a headline. It's an organic teal-to-indigo-to-violet flow field, built from layered noise, that leans gently toward the mouse.

### Uniforms used
All three: `u_time`, `u_resolution`, `u_mouse`.

### What each block of the shader does
- **`hash(p)`** — turns a 2D point into a pseudo-random 0–1 value. This is the only source of randomness in the whole shader; everything else is built on top of it.
- **`noise(p)`** — value noise: hashes the four corners of the grid cell containing `p`, then smoothly interpolates between them (`smoothstep`-weighted `mix`). This gives a soft, cloud-like gradient instead of hard random pixels.
- **`fbm(p)`** (fractal Brownian motion) — calls `noise` five times at increasing frequency and decreasing amplitude, and sums the results. Each extra layer adds finer detail on top of the broad shape from the first layer. This is what makes the flow field look organic rather than like a single blurred gradient.
- **`main()`**:
  1. Converts the pixel coordinate to `0–1` UV space and corrects for aspect ratio, so the noise pattern isn't stretched on wide screens.
  2. Multiplies `u_time` by `0` when reduced motion is active (`u_reduced`), which freezes the pattern on a single still frame instead of branching the shader logic.
  3. Offsets the sampling coordinate by the mouse position (`u_mouse`), so the whole flow field visibly drifts toward the cursor.
  4. Samples `fbm` twice, feeding the first result into the second, which produces the layered, marbled look rather than one flat noise field.
  5. Mixes three brand colours (teal, indigo, violet) by the noise values using `smoothstep` thresholds.
  6. Applies a radial vignette (darker at the edges) so it reads as a hero background, not a flat edge-to-edge texture.
  7. Adds a very small per-pixel grain to break up gradient banding.

### Reduced motion and performance fallback (one-liner)
`prefers-reduced-motion` freezes `u_time` in the shader so the same visual renders as a single still frame; device pixel ratio is capped at 1.75 to bound GPU cost on high-DPI screens; and the render loop stops calling `requestAnimationFrame` entirely (not just skipping draws) while the tab is hidden. If WebGL isn't available at all, a static CSS radial-gradient in the same palette shows instead, so there's never a blank hero.

### Text contrast
A CSS gradient scrim darkens the lower portion of the hero behind the headline and subtext, independent of what the shader is doing underneath, so text stays readable regardless of the noise pattern's brightness at any given moment.

### Run locally
Open `signature-hero/index.html` in a browser and move the mouse over the hero.

### Deploy (GitHub Pages)
Same repo, same Pages setup as the motion-button assignment. Live at `https://<username>.github.io/<repo>/signature-hero/`.
