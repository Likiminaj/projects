/**
 * setup-categories.js
 * Creates the Categories and Subcategories Notion databases and seeds defaults.
 * Run once after initial setup.
 * Usage: node scripts/setup-categories.js
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

const COLOR_OPTIONS = ['yellow','green','brown','orange','gray','pink','blue','purple','red','default']
  .map(c => ({ name: c, color: c === 'default' ? 'default' : c }))

const DEFAULT_CATEGORIES = [
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

const DEFAULT_SUBCATEGORIES = [
  { name: 'Hawker',             category: 'Food',   color: 'yellow'  },
  { name: 'Groceries',          category: 'Food',   color: 'green'   },
  { name: 'Cafe & Restaurants', category: 'Food',   color: 'orange'  },
  { name: 'Drinks & Delivery',  category: 'Food',   color: 'pink'    },
  { name: 'Gym',                category: 'Health', color: 'blue'    },
  { name: 'Bouldering',         category: 'Health', color: 'purple'  },
  { name: 'Supplements',        category: 'Health', color: 'gray'    },
  { name: 'Skincare',           category: 'Health', color: 'pink'    },
  { name: 'Medical',            category: 'Health', color: 'red'     },
]

function writeEnv(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  const regex = new RegExp(`^${key}=.*$`, 'm')
  content = regex.test(content)
    ? content.replace(regex, `${key}=${value}`)
    : content + `\n${key}=${value}\n`
  fs.writeFileSync(ENV_PATH, content)
}

async function run() {
  if (!process.env.NOTION_TOKEN)          { console.error('NOTION_TOKEN not set');          process.exit(1) }
  if (!process.env.NOTION_PARENT_PAGE_ID) { console.error('NOTION_PARENT_PAGE_ID not set'); process.exit(1) }

  const colorProp = { select: { options: COLOR_OPTIONS } }

  // ── Categories DB ───────────────────────────────────────────────────────────
  let catDbId = process.env.NOTION_CATEGORIES_DB
  if (catDbId) {
    console.log(`Categories DB already exists: ${catDbId}`)
  } else {
    console.log('Creating Categories database…')
    const db = await notion.databases.create({
      parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID },
      title:  [{ type: 'text', text: { content: 'Categories' } }],
      properties: { Name: { title: {} }, Color: colorProp, Active: { checkbox: {} } },
    })
    catDbId = db.id
    writeEnv('NOTION_CATEGORIES_DB', catDbId)
    console.log(`  ✓ Created: ${catDbId}`)
  }

  // ── Subcategories DB ────────────────────────────────────────────────────────
  let subcatDbId = process.env.NOTION_SUBCATEGORIES_DB
  if (subcatDbId) {
    console.log(`Subcategories DB already exists: ${subcatDbId}`)
  } else {
    console.log('Creating Subcategories database…')
    const db = await notion.databases.create({
      parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID },
      title:  [{ type: 'text', text: { content: 'Subcategories' } }],
      properties: { Name: { title: {} }, Category: { rich_text: {} }, Color: colorProp, Active: { checkbox: {} } },
    })
    subcatDbId = db.id
    writeEnv('NOTION_SUBCATEGORIES_DB', subcatDbId)
    console.log(`  ✓ Created: ${subcatDbId}`)
  }

  // ── Seed categories ─────────────────────────────────────────────────────────
  const existingCats = await notion.databases.query({ database_id: catDbId, page_size: 1 })
  if (existingCats.results.length === 0) {
    console.log('Seeding categories…')
    for (const cat of DEFAULT_CATEGORIES) {
      await notion.pages.create({
        parent: { database_id: catDbId },
        properties: {
          Name:   { title: [{ text: { content: cat.name } }] },
          Color:  { select: { name: cat.color } },
          Active: { checkbox: true },
        },
      })
      console.log(`  ✓ ${cat.name}`)
    }
  } else {
    console.log('Categories already seeded — skipped')
  }

  // ── Seed subcategories ──────────────────────────────────────────────────────
  const existingSubcats = await notion.databases.query({ database_id: subcatDbId, page_size: 1 })
  if (existingSubcats.results.length === 0) {
    console.log('Seeding subcategories…')
    for (const sub of DEFAULT_SUBCATEGORIES) {
      await notion.pages.create({
        parent: { database_id: subcatDbId },
        properties: {
          Name:     { title: [{ text: { content: sub.name } }] },
          Category: { rich_text: [{ text: { content: sub.category } }] },
          Color:    { select: { name: sub.color } },
          Active:   { checkbox: true },
        },
      })
      console.log(`  ✓ ${sub.name} (${sub.category})`)
    }
  } else {
    console.log('Subcategories already seeded — skipped')
  }

  console.log('\nDone. Restart the server.\n')
}

run().catch(err => { console.error(err.message); process.exit(1) })
