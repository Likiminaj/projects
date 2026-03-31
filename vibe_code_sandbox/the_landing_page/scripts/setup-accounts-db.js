/**
 * Creates the Accounts database in Notion, seeds 3 rows, writes ID to .env.
 * Run once: node scripts/setup-accounts-db.js
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
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_PARENT_PAGE_ID) {
    console.error('NOTION_TOKEN and NOTION_PARENT_PAGE_ID must be set in .env')
    process.exit(1)
  }

  if (process.env.NOTION_ACCOUNTS_DB) {
    console.log(`Accounts DB already configured: ${process.env.NOTION_ACCOUNTS_DB}`)
    return
  }

  console.log('\nCreating Accounts database…')
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Accounts' } }],
      properties: {
        Name:           { title: {} },
        Balance:        { number: { format: 'number' } },
        'Credit Limit': { number: { format: 'number' } },
        Type:           { select: { options: [
          { name: 'Checking',    color: 'blue'   },
          { name: 'Savings',     color: 'green'  },
          { name: 'Investments', color: 'purple' },
          { name: 'Credit Card',  color: 'red'    },
          { name: 'Loan',         color: 'orange' },
        ]}},
        'Last Updated': { date: {} },
      },
  })

  writeEnvKey('NOTION_ACCOUNTS_DB', db.id)
  console.log(`✓ Accounts DB created: ${db.id}`)
  console.log('✓ .env updated')

  // Seed rows
  const rows = [
    { name: 'DBS Checking',  type: 'Checking'    },
    { name: 'DBS Savings',   type: 'Savings'     },
    { name: 'Investments',   type: 'Investments' },
  ]
  for (const row of rows) {
    await notion.pages.create({
      parent: { database_id: db.id },
      properties: {
        Name:    { title: [{ text: { content: row.name } }] },
        Balance: { number: 0 },
        Type:    { select: { name: row.type } },
      },
    })
    console.log(`  ✓ Seeded: ${row.name}`)
  }
  console.log()
}

main().catch(err => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
