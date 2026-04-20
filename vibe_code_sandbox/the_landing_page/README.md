# The Landing Page

Personal dashboard for finance, tasks, and habits, backed by Notion.

## Requirements

- Node.js 20+
- A Notion integration token
- A parent Notion page that contains your databases

## Install

```bash
npm install
```

## Environment Setup

Create a `.env` file in the project root.

Start from the example file:

```bash
cp .env.example .env
```

Fill in at least:

```env
NOTION_TOKEN=
NOTION_PARENT_PAGE_ID=
```

Then run the sync script to populate the database IDs from your existing Notion page:

```bash
npm run sync-notion-env
```

`npm run setup-notion` does the same thing.

## Notion Setup

Your Notion page should contain the databases you already have, for example:

- `Transactions`
- `Recurring Expenses`
- `Budgets`
- `Savings Buckets`
- `Upcoming One-offs`
- `Monthly Reviews`
- `CPF Balances`
- `Category`
- `Reduction Plans`
- `Reduction Lines`
- `Payback`
- `Accounts`
- `Birthdays`
- `Tasks`
- `Habits`
- `Habit Logs`

If the page title differs slightly, the sync script accepts common aliases like `Categories`, `Spend Reduction Plans`, and `Spend Reduction Lines`.

## Run

Start the app:

```bash
npm run dev
```

This runs:

- Vite on the frontend
- Express on `http://localhost:3001`

The Vite dev server proxies `/api` requests to the backend.

## Other Scripts

- `npm run server` - start only the backend
- `npm run setup-accounts` - create the Accounts DB helper
- `npm run setup-reduction-dbs` - create reduction plan DB helpers
- `npm run migrate-recurring` - patch recurring schema changes
- `npm run migrate-accounts` - patch accounts schema changes

## Notes

- Keep `.env` out of version control.
- If you add or rename Notion databases, rerun `npm run sync-notion-env`.
- Restart the server after changing `.env`.
