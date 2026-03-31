/**
 * Creates the Birthdays database in Notion and writes its ID to .env.
 * Run once: node scripts/setup-birthdays-db.js
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

  if (process.env.NOTION_BIRTHDAYS_DB) {
    console.log(`Birthdays DB already configured: ${process.env.NOTION_BIRTHDAYS_DB}`)
    return
  }

  console.log('\nCreating Birthdays database…')
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Birthdays' } }],
    properties: {
      Name:   { title: {} },
      Budget: { number: { format: 'number' } },
      Month:  { number: { format: 'number' } },
      Day:    { number: { format: 'number' } },
      Notes:  { rich_text: {} },
    },
  })

  writeEnvKey('NOTION_BIRTHDAYS_DB', db.id)
  console.log(`✓ Birthdays DB created: ${db.id}`)
  console.log('✓ .env updated\n')
}

main().catch(err => {
  console.error('Setup failed:', err.message)
  if (err.body) console.error(JSON.stringify(err.body, null, 2))
  process.exit(1)
})
