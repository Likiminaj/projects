# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start frontend (Vite) + backend (Express) concurrently with hot reload
npm run server       # Start only the Express backend (port 3001)
```

**First-time setup:**
```bash
cp .env.example .env
# Fill in NOTION_TOKEN and NOTION_PARENT_PAGE_ID, then:
npm run sync-notion-env   # Auto-discovers all Notion database IDs and writes them to .env
```

**Schema migration scripts** (run as needed when Notion database structure changes):
```bash
npm run migrate-recurring
npm run migrate-accounts
```

There are no lint or test scripts configured.

## Architecture

This is a personal dashboard (Finance, Tasks, Habits) that uses **Notion as its sole database**. The stack is:

- **Frontend**: React 18 + React Router v6, built with Vite (dev server on port 5173)
- **Backend**: Express.js API on port 3001; Vite proxies `/api/*` to it during development
- **Data layer**: All reads/writes go through the Notion API (`@notionhq/client`), initialized as a singleton in `server/notion.js`

### Data flow

Frontend `fetch('/api/...')` → Vite proxy → Express route → Notion API → transform to plain objects → JSON response → React component local state (`useState`/`useEffect`).

There is no Redux, Context, or client-side cache — each page fetches its own data on mount.

### Backend routes

Routes are registered in `server/index.js` and live under `server/routes/`:

| Prefix | File(s) |
|---|---|
| `/api/finance/*` | `server/routes/finance/` (transactions, recurring, budgets, buckets, cpf, categories, upcoming, payback, birthdays, accounts, snapshots) |
| `/api/tasks` | `server/routes/tasks.js` |
| `/api/habits` | `server/routes/habits/` (habits, logs, review) |

Each route file follows the same pattern: query Notion with cursor-based pagination (100 items/page), map raw Notion page objects to plain JS objects, return JSON.

### Notion property handling

Notion properties can be either `Select` or `Relation` type for the same logical field (e.g. categories). The transactions route (`server/routes/finance/transactions.js`) caches property types on first request and builds query/write logic dynamically to handle both.

### Frontend structure

- `src/App.jsx` — route definitions
- `src/pages/finance/FinanceLayout.jsx` — tab bar for finance sub-routes (Overview, Ledger, Recurring, Birthdays, CPF, Payback)
- `src/components/BottomNav.jsx` — app-level navigation (Finance / Tasks / Habits)
- `src/lib/parseReceipt.js` — client-side OCR (Tesseract.js) and PDF text extraction (PDF.js) for receipt/statement parsing; runs entirely in the browser
- `src/styles/design-system.css` — CSS variables / design tokens used throughout; no CSS framework

### Environment variables

`.env.example` lists all required variables: `NOTION_TOKEN`, `NOTION_PARENT_PAGE_ID`, and one `NOTION_*_DB` variable per Notion database (14 databases total). Running `npm run sync-notion-env` populates the database IDs automatically from the parent page.
