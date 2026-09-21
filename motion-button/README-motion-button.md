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
