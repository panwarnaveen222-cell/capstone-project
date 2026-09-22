# My Capstone Project

A short description of what this project will do.

## Tech Stack
- Node.js (LTS)
- Git and GitHub
- Cursor (AI-assisted development)

## Getting Started

**Prerequisites:** [Node.js LTS](https://nodejs.org/) and Git.

```bash
git clone https://github.com/panwarnaveen222-cell/capstone-project.git
cd capstone-project
```

The application has not been initialized yet. After `npm init` and the first app files land, this section will cover install and run commands.


## Buttons with a Brain: Motion & State Micro-interactions

A state-driven button system in one file (`motion-button/index.html`, plain HTML, CSS and JS, no build step). Two buttons ("Send message" and "Save draft") share the same motion language. Each one has these states: idle, hover, focus-visible, pressed, loading, success, error and disabled.

**Demo controls:** the page has a toggle for "Random (20% fail)", "Always succeed" and "Always fail", so a reviewer can see both success and error on demand. A checkbox disables both buttons.

### Duration and easing choices

| Token | Value | Used for | Why |
|---|---|---|---|
| `--dur-press` | 120ms | Press (scale 0.97) | Direct feedback has to feel instant, or the button feels laggy. |
| `--dur-hover` | 180ms | Hover lift, focus ring | Short and light, and easy to reverse if the pointer leaves. |
| `--dur-swap` | 320ms | Label slides (idle, loading, result) | Long enough to be read as movement, short enough not to slow the user down. |
| `--dur-color` | 260ms | Success/error colour crossfade | Slightly slower than hover so the colour change feels like a result, not a flicker. |
| `--ease-out` | cubic-bezier(.22,1,.36,1) | Things arriving (hover, ring) | Fast start and soft landing feels responsive. |
| `--ease-in-out` | cubic-bezier(.65,0,.35,1) | Label swaps, colour fades | Things that leave one place and enter another look best when they accelerate and settle. |
| `--ease-pop` | cubic-bezier(.34,1.56,.64,1) | Success checkmark | A small overshoot gives a "done" moment, used only here. |

### How the requirements are met

- **No abrupt swaps:** every label is always in the DOM and only moves (`transform`, `opacity`). Colours change by crossfading overlay layers with `opacity`, not by animating `background-color`.
- **Compositor-friendly:** only `transform` and `opacity` are animated. The button has a fixed width, so nothing changes layout during a transition.
- **Interruptible:** state is a single `data-state` attribute, and CSS transitions reverse smoothly if it changes mid-flight. While loading or showing success, the button uses `aria-disabled` and ignores clicks, so spam-clicking cannot stack requests. A run ID discards stale results.
- **Keyboard and screen readers:** it is a real `<button>`. Keyboard focus shows a visible ring (`:focus-visible`). A separate `role="status"` region announces "Sending message", "Message sent" or "Sending failed. Press to retry."
- **`prefers-reduced-motion`:** slides become in-place crossfades, the spinner stops rotating (the "Sending…" text still says what is happening), and the error shake is skipped. The red colour and the Retry label stay, so feedback is never lost.
- **Error recovery:** the button stays in the error state until it is clicked again, which retries.

### Colours
White text on each button colour passes WCAG AA contrast (brand `#0b5563`, success `#1a6b3a`, error `#a4262c`).

### Run locally
Open `motion-button/index.html` in a browser.

### Deploy (GitHub Pages)
Repo Settings > Pages > Deploy from a branch > `main` / root. The demo will be at `https://<username>.github.io/<repo>/motion-button/`.


**Live demo:** https://panwarnaveen222-cell.github.io/capstone-project/motion-button/


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


**Live demo:** https://panwarnaveen222-cell.github.io/capstone-project/signature-hero/
