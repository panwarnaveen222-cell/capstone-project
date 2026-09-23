# Action Item Extractor

Paste messy meeting notes, get back a structured list of action items (task, owner, deadline) — extracted by Claude and rendered as real UI, not a chat transcript. Built for FlyRank Front-end AI Engineering, assignment FE-11 (Production deployment and README).

**Live URL:** https://YOUR-VERCEL-PROJECT.vercel.app  *(replace after deploying)*

## Screenshots
*(add 2–3 screenshots here after deploying: the empty form, a filled result, and the error/rate-limit state)*

## What it does
- You paste or write free-text notes into a textarea (capped at 4,000 characters, enforced in both the UI and the server).
- The **Extract action items** button sends the text to a serverless API route.
- The route calls the Claude API with a system prompt that asks for a JSON array of `{task, owner, deadline}` objects, then parses and returns it.
- The page renders each item as a card. If the model's reply isn't valid JSON, the raw text is shown instead of the page breaking.

## Run it locally
```bash
npm i -g vercel
vercel login
vercel dev
```
Then open `http://localhost:3000`. You'll need an `ANTHROPIC_API_KEY` in a local `.env` file (see below) before the Extract button will work — the static page itself loads without one.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key from console.anthropic.com. Never committed — set it in Vercel's dashboard or a local `.env` file (already in `.gitignore`). |
| `ANTHROPIC_MODEL` | No | Overrides the model used. Defaults to `claude-3-5-haiku-20241022`. |

## Deploying to Vercel (production)
1. Push this repo to GitHub (already done as part of this capstone).
2. In the Vercel dashboard, **Add New Project** → import this GitHub repo.
3. Set **Root Directory** to `ai-note-helper`, since this repo also holds three other, unrelated static demos.
4. Add the `ANTHROPIC_API_KEY` environment variable under **Settings → Environment Variables**, scoped to Production (and Preview, if you want PR previews to work too).
5. Deploy. Vercel auto-detects the `api/` folder as serverless functions and serves `index.html` as the static entry point.
6. To promote a specific deploy to production later, use **Deployments → \[pick one\] → Promote to Production**, or push to the connected branch.

## Architecture overview
```
ai-note-helper/
├── index.html        Static frontend: textarea, character counter, results list. No framework, no build step.
├── api/
│   └── extract.js    Vercel serverless function (Node runtime). Validates input, rate-limits by IP,
│                      calls the Claude API, parses the structured response, returns JSON.
└── vercel.json        Sets maxDuration on the function.
```
The frontend never talks to the Claude API directly — `ANTHROPIC_API_KEY` only exists server-side, inside the serverless function's environment. This is the reason the route exists at all, rather than calling the API straight from the browser.

## AI integration: how and why
- **What:** structured extraction (JSON in, JSON out), not a chatbot. The system prompt explicitly forbids prose or markdown fences, so the output is always parseable data the UI can render as cards.
- **Why this and not a chat box:** the brief asks for AI that solves something, not a gimmick. A generic "ask me anything" box wasn't the goal; turning unstructured notes into a list a reviewer can act on is.
- **Model:** `claude-3-5-haiku-20241022` by default — fast and inexpensive for a small extraction task like this; swappable via `ANTHROPIC_MODEL`.

## Production hygiene (abuse protection)
- **Input cap:** 4,000 characters, rejected with a 413 before the request reaches Claude.
- **Rate limiting:** a per-IP in-memory counter allows 5 requests per rolling 60-second window, returning 429 past that.
- **Cost ceiling:** `max_tokens: 600` on every API call, so a single request has a hard upper bound on cost regardless of input size.
- **`maxDuration`:** capped at 15 seconds in `vercel.json`.
- **Known limitation, stated honestly:** the rate limiter is an in-memory `Map` inside the function, which resets whenever the serverless instance goes cold and isn't shared across multiple warm instances under real concurrent traffic. It stops a casual abuser clicking the button repeatedly, but it is **not** a substitute for a real distributed limiter. With more time, this would move to Vercel KV or Upstash Redis, keyed by IP, so the count is shared across all instances.

## Cross-browser pass
Tested manually on:
- Chrome (desktop) — pass
- Firefox (desktop) — pass
- Safari (desktop) — *(fill in: pass/fail/not tested — see limitation note below)*
- Mobile Safari (iPhone) — *(fill in: pass/fail/not tested)*

*(Honest note if you don't have a Mac/iPhone: "Tested on Chrome and Firefox on Windows and on Chrome for Android. I don't have access to a Mac or iPhone, so Safari and mobile Safari are untested; the page uses only standard fetch/flexbox/CSS with no vendor-specific APIs, so I expect it to work, but this is a known gap rather than a verified pass.")*

## Decisions
- **No framework:** a single static HTML file plus one serverless function is the smallest thing that satisfies the brief; React/Next.js would add a build step with no real benefit at this size.
- **In-memory rate limiting over a paid add-on:** honest trade-off for a portfolio project's cost and time budget — documented above rather than hidden.
- **Haiku over a larger model:** the task (short extraction) doesn't need a bigger model, and it keeps the per-request cost low if the public URL gets traffic.

## What I'd add with more time
- A shared, persistent rate limiter (Vercel KV/Upstash) instead of the in-memory one.
- Real Safari/mobile Safari testing.
- A small test suite around the JSON-parsing fallback path.

## How AI tools built this
Built with Cursor (AI-assisted editor) as the coding partner throughout this internship track. Specifics, not a generic "AI helped":
- Cursor's chat scaffolded the initial shape of the serverless function (the request-validation → rate-limit → API-call → parse pipeline) from a description of the requirements; I then read through it, changed the rate-limit window and the character cap to match this project's actual needs, and rewrote the error messages to be specific rather than generic.
- The system prompt sent to Claude (in `api/extract.js`) was iterated by hand: an early version allowed markdown code fences in the reply, which broke `JSON.parse`; I added the explicit "no markdown fences" instruction after seeing that fail locally.
- The frontend's escape-HTML helper and the defensive `parseFailed` fallback path were added after asking Cursor "what happens if the model doesn't return valid JSON" and building the fallback UI myself.
- I did not commit an `ANTHROPIC_API_KEY` at any point; this was checked against `.gitignore` before every push.
