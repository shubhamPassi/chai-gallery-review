# AI-assisted Google Review QR

A small, mobile-first page for customers who scan a QR code at your shop. They can describe their real experience, optionally use Gemini to turn it into a clear review draft, edit it, copy it, and continue to your official Google review page.

## Project layout

- `frontend/` – static site; deploy it to GitHub Pages.
- `worker/` – Cloudflare Worker that keeps the Gemini API key private.

## Before deployment

1. The Chai Gallery name, logo, review link, and review topics are already set in [`frontend/config.js`](frontend/config.js).
2. Create a Gemini API key in Google AI Studio. Your Google AI Pro consumer subscription and Gemini API billing are separate.

## Run locally

In one terminal, run the Worker:

```powershell
cd worker
npm install
Copy-Item .dev.vars.example .dev.vars
# Edit .dev.vars and set GEMINI_API_KEY
npm run dev
```

In another terminal, serve the static page from the workspace root:

```powershell
npx serve frontend -l 3000
```

For local testing, temporarily set `API_URL` to `http://127.0.0.1:8787/api/generate-review` in `frontend/config.js`, and set `ALLOWED_ORIGIN=http://127.0.0.1:3000` in `worker/.dev.vars`.

## Deploy

1. In `worker/wrangler.toml`, choose an unused Worker name.
2. From `worker/`, run `npx wrangler login`, then `npx wrangler secret put GEMINI_API_KEY` and `npm run deploy`.
3. Set the Worker variables in the Cloudflare dashboard:
   - `ALLOWED_ORIGIN`: exact final site origin, such as `https://yourname.github.io`
   - `GEMINI_MODEL`: `gemini-3.1-flash-lite`
4. Put the deployed Worker endpoint into `frontend/config.js` as `apiUrl`.
5. Publish `frontend/` through the `shubhamPassi/chai-gallery-review` GitHub Pages repository. Its expected origin is `https://shubhampassi.github.io`; set `ALLOWED_ORIGIN` to that exact origin. Update it if you later use a custom domain.
6. Generate the printed QR from the final branded site URL, not the Google review URL. This lets you change the Google link later without reprinting the QR.

## Production safeguards

The Worker validates requests, only accepts a configured browser origin, does not log review text, and has a small per-isolate abuse guard. Before printing the QR, also create a Cloudflare WAF rate-limit rule for `POST /api/generate-review` (for example, 10 requests per IP per minute). Do not offer discounts, gifts, or rewards for reviews, and do not direct only high ratings to Google.
