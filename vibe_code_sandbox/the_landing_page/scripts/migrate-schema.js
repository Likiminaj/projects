/**
 * migrate-schema.js
 * Patches existing Notion databases to add any missing properties.
 * Safe to run multiple times. Notion ignores properties that already exist.
 *
 * Usage: node scripts/migrate-schema.js
 */

import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const CATEGORY_OPTIONS = [
  { name: 'Food', color: 'yellow' },
  { name: 'Health', color: 'green' },
  { name: 'Transport', color: 'brown' },
  { name: 'Shopping', color: 'orange' },
  { name: 'Bills & Subscriptions', color: 'gray'    },
  { name: 'Gifts & Celebrations', color: 'pink' },
  { name: 'Travel', color: 'blue' },
  { name: 'Pending Matcha', color: 'green' },
  { name: 'Other', color: 'default' },
]

const SOURCE_OPTIONS = [
  { name: 'DBS',     color: 'red'     },
  { name: 'PayLah',  color: 'purple'  },
  { name: 'YouTrip', color: 'blue'    },
  { name: 'Cash',    color: 'green'   },
  { name: 'Other',   color: 'default' },
]

const DIRECTION_OPTIONS = [
  { name: 'Income',  color: 'green' },
  { name: 'Expense', color: 'red'   },
]

async function patch(label, dbId, properties) {
  if (!dbId) { console.log(`  ⚠  Skipping ${label} — env var not set`); return }
  try {
    await notion.databases.update({ database_id: dbId, properties })
    console.log(`  ✓  ${label}`)
  } catch (err) {
    console.error(`  ✗  ${label}: ${err.message}`)
  }
}

async function run() {
  console.log('\nMigrating Recurring Expenses DB…')
  await patch(
    'Add Direction, Category, Merchant, Source, Is Pending Matcha, Notes, Day',
    process.env.NOTION_RECURRING_DB,
    {
      Direction:           { select: { options: DIRECTION_OPTIONS } },
      Category:            { select: { options: CATEGORY_OPTIONS } },
      Merchant:            { rich_text: {} },
      Source:              { select: { options: SOURCE_OPTIONS } },
      'Is Pending Matcha': { checkbox: {} },
      Notes:               { rich_text: {} },
      Day:                 { number: { format: 'number' } },
    }
  )

  console.log('\nMigrating Budgets DB…')
  await patch(
    'Add Month field',
    process.env.NOTION_BUDGETS_DB,
    { Month: { rich_text: {} } }
  )

  console.log('\nMigrating CPF Balances DB…')
  await patch(
    'Add Type field',
    process.env.NOTION_CPF_DB,
    {
      Type: { select: { options: [
        { name: 'opening', color: 'gray'  },
        { name: 'monthly', color: 'blue'  },
      ] } },
    }
  )

  // Seed opening balance if no "opening" entry exists
  if (process.env.NOTION_CPF_DB) {
    console.log('\nChecking CPF opening balance…')
    try {
      const existing = await notion.databases.query({
        database_id: process.env.NOTION_CPF_DB,
        filter: { property: 'Type', select: { equals: 'opening' } },
        page_size: 1,
      })
      if (existing.results.length === 0) {
        await notion.pages.create({
          parent: { database_id: process.env.NOTION_CPF_DB },
          properties: {
            Month: { title: [{ text: { content: '2026-03-opening' } }] },
            OA:    { number: 48055.33 },
            SA:    { number: 14388.31 },
            MA:    { number: 15780.75 },
            Type:  { select: { name: 'opening' } },
          },
        })
        console.log('  ✓  Seeded opening balance (2026-03-opening)')
      } else {
        console.log('  ✓  Opening balance already exists — skipped')
      }
    } catch (err) {
      console.error(`  ✗  Seeding opening balance: ${err.message}`)
    }
  }

  console.log('\nDone. Restart the server to clear schema caches.\n')
}

run()
