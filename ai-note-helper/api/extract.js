// api/extract.js
// Serverless function (Vercel, Node runtime). Takes messy free-text notes
// and returns a structured list of action items using the Claude API.
//
// Production hygiene, per FE-11:
//   1. Input is capped at 4000 characters before it ever reaches the AI call.
//   2. A per-IP rate limit rejects bursts (best-effort — see README for
//      the honest limitation of an in-memory limiter on serverless).
//   3. max_tokens is capped server-side so a single request has a hard
//      ceiling on API cost.
//   4. The AI's response is parsed defensively: if it isn't valid JSON,
//      the route still returns a clean error instead of crashing or
//      forwarding garbage to the client.

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_INPUT_CHARS = 4000;

// In-memory per-IP counter. Resets whenever this function instance goes
// cold — see the README's "known limitations" section for why this is
// good enough for a portfolio project but not for a business.
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
  }

  const notes = req.body && typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
  if (!notes) {
    return res.status(400).json({ error: 'Send { "notes": "..." } with some text.' });
  }
  if (notes.length > MAX_INPUT_CHARS) {
    return res.status(413).json({ error: `Notes are too long (max ${MAX_INPUT_CHARS} characters).` });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fails loudly on the server side, but the client just sees a clean
    // "temporarily unavailable" message rather than a stack trace.
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600, // hard cost ceiling per request
        system:
          'You extract action items from messy notes. Respond with ONLY a JSON array, ' +
          'no prose and no markdown fences. Each item: {"task": string, "owner": string|null, ' +
          '"deadline": string|null}. Guess owner/deadline only if clearly implied by the text; ' +
          'use null when unclear. If there are no action items, respond with [].',
        messages: [{ role: 'user', content: notes }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('Anthropic API error', upstream.status, detail);
      return res.status(502).json({ error: 'AI service error. Try again shortly.' });
    }

    const data = await upstream.json();
    const raw = data.content?.[0]?.text ?? '[]';

    let items;
    try {
      items = JSON.parse(raw);
      if (!Array.isArray(items)) throw new Error('not an array');
    } catch {
      // Structured-output fallback: the model didn't return clean JSON.
      // Return the raw text so the UI can show *something* instead of
      // a bare error, but flag it so the frontend can render it differently.
      return res.status(200).json({ items: [], raw, parseFailed: true });
    }

    return res.status(200).json({ items, parseFailed: false });
  } catch (err) {
    console.error('Handler error', err);
    return res.status(502).json({ error: 'AI service is temporarily unavailable.' });
  }
}
