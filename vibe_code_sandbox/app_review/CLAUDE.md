# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start both Vite (port 5274) and Express server (port 8787) concurrently
npm run server     # start Express server only
npm run build      # production build via Vite
npm run preview    # preview production build
```

There is no test suite or linter configured.

## Architecture

This is a full-stack React + Express app for analyzing app store reviews with sentiment scoring.

**Two processes run in dev:**
- **Express server** (`server/index.js`) on port 8787 — handles all `/api/*` routes
- **Vite dev server** (`vite.config.js`) on port 5274 — proxies `/api` to 8787

**Data flow:**

1. User searches Google Play via `/api/search` → Express calls `google-play-scraper`
2. User selects apps and clicks Analyse → frontend opens `EventSource` connections to `/api/reviews/stream`
3. Server streams review batches via SSE; each batch is normalized, deduped, sentiment-scored (VADER), and enriched with `review_month` / `review_length` / `has_text`
4. Frontend accumulates batches in React state, computing `aggregateClientSide()` on each update to drive charts and tables

**iOS path:** screenshots are uploaded to `/api/ios/parse` (multipart), which calls Claude (`claude-sonnet-4-6`) with a vision prompt to extract structured reviews. The result is merged with the same enrichment pipeline on the client side.

**Key data shape:** every review carries `{ review_text, rating, date, platform, app_name, version, review_id, author, source, review_month, review_length, has_text, sentiment_score, sentiment_label }`.

**Frontend state** lives entirely in `App.jsx` — no global store. `analysisData.byApp` is keyed by `app_id` and holds `{ app, reviews[], aggregation[] }` per app.

**`src/lib/fuzzy.js`** — client-side re-ranking of search results returned by the server. Fields are weighted: name (2.4×), publisher (1.3×), category (1×), description/aliases (0.8×).

**`src/components/SentimentChart.jsx`** — renders a sentiment trend line and review volume bar chart using Recharts. Includes a PNG download that rasterizes the SVGs via Canvas API.

**`src/components/ui.jsx`** — shared primitives (Button, Badge, Card, Field, Input, Note, Spinner, Divider).

## Environment

The server reads `ANTHROPIC_API_KEY` from the environment (via the Anthropic SDK default). `PORT` defaults to `8787`.
