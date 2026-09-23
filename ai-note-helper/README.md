# Action Item Extractor

Paste messy meeting notes, get back a structured list of action items (task, owner, deadline) — extracted by AI and rendered as real UI, not a chat transcript. Built for FlyRank Front-end AI Engineering, assignment FE-11 (Production deployment and README).

**Live URL:** https://capstone-project-pi-vert.vercel.app

*(Confirm this is your exact URL — copy it from the Vercel dashboard's Deployments tab if different.)*

## Screenshots
1. **Successful extraction** — 3 action items found from sample notes, each with task/owner/deadline.
2. **Rate limit** — after 5 requests in under a minute, the 6th shows "Too many requests. Wait a minute and try again."
3. **Input cap** — pasting more than 4,000 characters is blocked before it reaches the AI.

*(Add the actual image files to this repo, e.g. in a `screenshots/` folder, and reference them here, or attach them directly to your assignment submission.)*

## What it does
- You paste or write free-text notes into a textarea (capped at 4,000 characters, enforced in both the UI and the server).
- The **Extract action items** button sends the text to a serverless API route.
- The route calls an LLM with a system prompt that asks for structured JSON (`{"items": [{task, owner, deadline}]}`), then parses and returns it.
- The page renders each item as a card. If the model's reply isn't valid JSON, the raw text is shown instead of the page breaking.

## Run it locally
```bash
npm i -g vercel
vercel login
vercel dev
```
Then open `http://localhost:3000`. You'll need a `GROQ_API_KEY` in a local `.env` file (see below) before the Extract button will work — the static page itself loads without one.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Your API key from console.groq.com (free tier, no card required). Never committed — set it in Vercel's dashboard or a local `.env` file (already in `.gitignore`). |
| `GROQ_MODEL` | No | Overrides the model used. Defaults to `llama-3.3-70b-versatile` in code, but **this deployment actually runs with `GROQ_MODEL=openai/gpt-oss-20b`** — see "How AI tools built this" for why. |

## Deploying to Vercel (production)
1. Push this repo to GitHub (already done as part of this capstone).
2. In the Vercel dashboard, **Add New Project** → import this GitHub repo.
3. Set **Root Directory** to `ai-note-helper`, since this repo also holds three other, unrelated static demos.
4. Add the `GROQ_API_KEY` environment variable under **Settings → Environment Variables**, scoped to Production (and Preview, if you want PR previews to work too).
5. Add `GROQ_MODEL` = `openai/gpt-oss-20b` as well — this account's key doesn't have access to the Llama models, only to OpenAI-OSS, Qwen and a few others (see below).
6. Deploy. Vercel auto-detects the `api/` folder as serverless functions and serves `index.html` as the static entry point.
7. To promote a specific deploy to production later, use **Deployments → [pick one] → Promote to Production**, or push to the connected branch.

## Architecture overview
```
ai-note-helper/
├── index.html        Static frontend: textarea, character counter, results list. No framework, no build step.
├── api/
│   └── extract.js    Vercel serverless function (Node runtime). Validates input, rate-limits by IP,
│                      calls the AI API, parses the structured response, returns JSON.
└── vercel.json        Sets maxDuration on the function.
```
The frontend never talks to the AI API directly — `GROQ_API_KEY` only exists server-side, inside the serverless function's environment. This is the reason the route exists at all, rather than calling the API straight from the browser.

## AI integration: how and why
- **What:** structured extraction (JSON in, JSON out), not a chatbot. The system prompt explicitly forbids prose outside the JSON object, and Groq's `response_format: {type: "json_object"}` mode enforces valid JSON at the API level, so the output is reliably parseable data the UI can render as cards.
- **Why this and not a chat box:** the brief asks for AI that solves something, not a gimmick. A generic "ask me anything" box wasn't the goal; turning unstructured notes into a list a reviewer can act on is.
- **Provider and model:** originally built against the Claude API, then switched to Groq because my Anthropic account required paid credits to make any live calls, and I wanted a genuinely free, testable deployment for this submission. Groq's free tier needs no card and the API is OpenAI-compatible, so the swap only touched the request/response shape in `api/extract.js`. The model actually running in production is `openai/gpt-oss-20b`, not a Llama model — I discovered this by calling Groq's `GET /v1/models` endpoint directly with my key and reading back the list of models it actually had access to, after both `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` returned 404 "does not exist or you do not have access to it" despite being documented as generally-available production models. `openai/gpt-oss-20b` was in my key's list and explicitly supports `json_mode` and `structured_outputs`, so it's a good fit for this task. The brief allows "Claude API, LLM integration, or similar," and this fits.

## Production hygiene (abuse protection)
- **Input cap:** 4,000 characters, rejected with a 413 before the request reaches the AI.
- **Rate limiting:** a per-IP in-memory counter allows 5 requests per rolling 60-second window, returning 429 past that.
- **Cost ceiling:** `max_tokens: 600` on every API call, so a single request has a hard upper bound on token usage regardless of input size.
- **`maxDuration`:** capped at 15 seconds in `vercel.json`.
- **Known limitation, stated honestly:** the rate limiter is an in-memory `Map` inside the function, which resets whenever the serverless instance goes cold and isn't shared across multiple warm instances under real concurrent traffic. It stops a casual abuser clicking the button repeatedly, but it is **not** a substitute for a real distributed limiter. With more time, this would move to Vercel KV or Upstash Redis, keyed by IP, so the count is shared across all instances.

## Cross-browser pass
Tested manually on:
- Chrome (desktop, Windows) — pass, full flow including rate limit and input cap confirmed working
- Firefox (desktop, Windows) — *(fill in after testing)*
- Safari (desktop) — not tested; no access to a Mac
- Mobile Safari (iPhone) — not tested; no access to an iPhone

The page uses only standard `fetch`, flexbox and CSS with no vendor-specific APIs, so I expect it to work on Safari, but this is a known, stated gap rather than a verified pass.

## Decisions
- **No framework:** a single static HTML file plus one serverless function is the smallest thing that satisfies the brief; React/Next.js would add a build step with no real benefit at this size.
- **In-memory rate limiting over a paid add-on:** honest trade-off for a portfolio project's cost and time budget — documented above rather than hidden.
- **Groq over a paid API:** the task (short extraction) doesn't need a large proprietary model, and Groq's free tier keeps this deployment genuinely runnable end-to-end without payment — documented as a real constraint I worked within, not hidden.

## What I'd add with more time
- A shared, persistent rate limiter (Vercel KV/Upstash) instead of the in-memory one.
- Real Safari/mobile Safari testing.
- A small test suite around the JSON-parsing fallback path.

## How AI tools built this
Built with Cursor (AI-assisted editor) as the coding partner throughout this internship track. Specifics, not a generic "AI helped":
- Cursor's chat scaffolded the initial shape of the serverless function (the request-validation → rate-limit → API-call → parse pipeline) from a description of the requirements; I then read through it, changed the rate-limit window and the character cap to match this project's actual needs, and rewrote the error messages to be specific rather than generic.
- The first version called the Claude API. In production it returned HTTP 400 for every request; the Vercel runtime logs showed this was because my Anthropic account had no billing credit. I switched the backend to Groq's free API instead — an OpenAI-compatible endpoint — which only meant changing the request body shape (`messages` format, `response_format: {type:"json_object"}`) and the response parsing path (`data.choices[0].message.content` instead of `data.content[0].text`). The rate limiting, input cap, and frontend needed no changes.
- The system prompt was iterated by hand: an early version allowed the model to wrap its reply in markdown code fences, which broke `JSON.parse`; after switching to Groq I also had to change the schema from a bare JSON array to `{"items": [...]}`, since Groq's `json_object` response format requires a top-level object, not an array.
- After switching to Groq, the default model (`llama-3.3-70b-versatile`) still failed with a 404 in production. Rather than guess at a replacement, I called Groq's `GET /v1/models` endpoint directly with my own key from PowerShell to see exactly which models it had access to. The list showed no Llama models at all — only OpenAI-OSS, Qwen, ALLaM and a couple of audio/guard models — which explained the 404s precisely. I picked `openai/gpt-oss-20b` from that real list because its `supported_features` explicitly included `json_mode` and `structured_outputs`.
- The frontend's escape-HTML helper and the defensive `parseFailed` fallback path were added after asking Cursor "what happens if the model doesn't return valid JSON" and building the fallback UI myself.
- **A real mistake and fix, stated honestly:** while generating a new Claude API key, I accidentally shared a screenshot of the full key before it was ever used anywhere. I revoked it immediately in the Anthropic console and never used it — the incident is noted here because it's a genuine lesson in this project about why API keys belong only in environment variables and never in any client, chat, or committed file.
- No API key is committed anywhere in this repo at any point; `.env`, `.env.local`, and `.vercel` are all in `.gitignore`, checked before every push.
