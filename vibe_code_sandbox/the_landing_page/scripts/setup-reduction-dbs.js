/**
 * Creates the two Spend Reduction databases in Notion and writes their IDs to .env.
 * Run once: node scripts/setup-reduction-dbs.js
 */
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH  = path.resolve(__dirname, '../.env')
const notion    = new Client({ auth: process.env.NOTION_TOKEN })

const CATEGORY_OPTIONS = [
  { name: 'Food',                  color: 'yellow'  },
  { name: 'Health',                color: 'green'   },
  { name: 'Transport',             color: 'brown'   },
  { name: 'Shopping',              color: 'orange'  },
  { name: 'Bills & Subscriptions', color: 'gray'    },
  { name: 'Gifts & Celebrations',  color: 'pink'    },
  { name: 'Travel',                color: 'blue'    },
  { name: 'Pending Matcha',        color: 'green'   },
  { name: 'Other',                 color: 'default' },
]

function writeEnvKey(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  const regex = new RegExp(`^${key}=.*$`, 'm')
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`)
  } else {
    if (!content.endsWith('\n')) content += '\n'
    content += `${key}=${value}\n`
  }
  fs.writeFileSync(ENV_PATH, content)
}

async function main() {
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID
  if (!process.env.NOTION_TOKEN || !parentPageId) {
    console.error('NOTION_TOKEN and NOTION_PARENT_PAGE_ID must be set in .env')
    process.exit(1)
  }

  if (process.env.NOTION_REDUCTION_PLANS_DB && process.env.NOTION_REDUCTION_LINES_DB) {
    console.log('Both reduction databases already configured in .env — nothing to do.')
    console.log(`  NOTION_REDUCTION_PLANS_DB=${process.env.NOTION_REDUCTION_PLANS_DB}`)
    console.log(`  NOTION_REDUCTION_LINES_DB=${process.env.NOTION_REDUCTION_LINES_DB}`)
    return
  }

  console.log('\n=== Setting up Spend Reduction databases ===\n')

  // ── 1. Spend Reduction Plans ──────────────────────────────────────────────
  let plansId = process.env.NOTION_REDUCTION_PLANS_DB
  if (!plansId) {
    console.log('Creating "Spend Reduction Plans" database…')
    const plansDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: 'Spend Reduction Plans' } }],
      properties: {
        Name:          { title: {} },
        Shortfall:     { number: { format: 'number' } },
        'Start Month': { date: {} },
        'End Month':   { date: {} },
        Status: {
          select: {
            options: [
              { name: 'Active',    color: 'green' },
              { name: 'Completed', color: 'gray'  },
            ],
          },
        },
        Notes: { rich_text: {} },
        // Linked Bucket relation added after we know the buckets DB ID
        ...(process.env.NOTION_BUCKETS_DB ? {
          'Linked Bucket': {
            relation: {
              database_id: process.env.NOTION_BUCKETS_DB,
              single_property: {},
            },
          },
        } : {}),
      },
    })
    plansId = plansDb.id
    writeEnvKey('NOTION_REDUCTION_PLANS_DB', plansId)
    console.log(`  ✓ Spend Reduction Plans: ${plansId}`)
  } else {
    console.log(`  ✓ Spend Reduction Plans already set: ${plansId}`)
  }

  // ── 2. Spend Reduction Lines ──────────────────────────────────────────────
  let linesId = process.env.NOTION_REDUCTION_LINES_DB
  if (!linesId) {
    console.log('Creating "Spend Reduction Lines" database…')
    const linesDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: 'Spend Reduction Lines' } }],
      properties: {
        Name:             { title: {} },
        Category:         { select: { options: CATEGORY_OPTIONS } },
        'Original Limit': { number: { format: 'number' } },
        'Reduced Limit':  { number: { format: 'number' } },
        Months:           { number: { format: 'number' } },
        Plan: {
          relation: {
            database_id: plansId,
            single_property: {},
          },
        },
      },
    })
    linesId = linesDb.id
    writeEnvKey('NOTION_REDUCTION_LINES_DB', linesId)
    console.log(`  ✓ Spend Reduction Lines: ${linesId}`)
  } else {
    console.log(`  ✓ Spend Reduction Lines already set: ${linesId}`)
  }

  console.log('\n✓ Done. .env updated with both IDs.')
  console.log('Restart your server for the changes to take effect.\n')
}

main().catch(err => {
  console.error('\nSetup failed:', err.message)
  if (err.body) console.error('Notion error:', JSON.stringify(err.body, null, 2))
  process.exit(1)
})
