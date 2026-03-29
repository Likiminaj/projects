/**
 * seed-budgets.js
 * Seeds the Budgets database with default rows (Month = "default").
 * Safe to re-run — only inserts when the database is empty.
 * Usage: node scripts/seed-budgets.js
 *
 * NOTE: If you already have rows with the old schema (Food - Hawker style),
 * delete them in Notion first, then re-run this script.
 */

import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const DEFAULT_BUDGETS = [
  { category: 'Food',                  limit: 700,  type: 'Soft' },
  { category: 'Health',                limit: 300,  type: 'Soft' },
  { category: 'Transport',             limit: 150,  type: 'Soft' },
  { category: 'Shopping',              limit: 200,  type: 'Hard' },
  { category: 'Bills & Subscriptions', limit: 200,  type: 'Soft' },
  { category: 'Gifts & Celebrations',  limit: 100,  type: 'Soft' },
  { category: 'Travel',                limit: 0,    type: 'Soft' },
  { category: 'Pending Matcha',        limit: 0,    type: 'Soft' },
  { category: 'Other',                 limit: 100,  type: 'Soft' },
]

async function run() {
  if (!process.env.NOTION_TOKEN)      { console.error('NOTION_TOKEN not set');      process.exit(1) }
  if (!process.env.NOTION_BUDGETS_DB) { console.error('NOTION_BUDGETS_DB not set'); process.exit(1) }

  const existing = await notion.databases.query({
    database_id: process.env.NOTION_BUDGETS_DB,
    page_size: 1,
  })
  if (existing.results.length > 0) {
    console.log('Budgets DB already has entries — skipping.')
    console.log('Delete all rows in Notion and re-run to reseed.')
    process.exit(0)
  }

  console.log(`Seeding ${DEFAULT_BUDGETS.length} default budget rows…`)
  for (const b of DEFAULT_BUDGETS) {
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_BUDGETS_DB },
      properties: {
        Category:        { title: [{ text: { content: b.category } }] },
        'Monthly Limit': { number: b.limit },
        Type:            { select: { name: b.type } },
        Month:           { rich_text: [{ text: { content: 'default' } }] },
        Active:          { checkbox: true },
      },
    })
    console.log(`  ✓  ${b.category}  $${b.limit}  (${b.type})`)
  }
  console.log('\nDone.\n')
}

run().catch(err => { console.error(err.message); process.exit(1) })
