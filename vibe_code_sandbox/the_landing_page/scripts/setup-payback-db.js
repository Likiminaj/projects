/**
 * Creates the Payback Queue database in Notion under the finance parent page.
 * Run once: node scripts/setup-payback-db.js
 * After running, copy the printed DB ID into your .env as NOTION_PAYBACK_DB
 */
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function main() {
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID
  if (!parentPageId) {
    console.error('NOTION_PARENT_PAGE_ID not set in .env')
    process.exit(1)
  }

  console.log('\nCreating Payback Queue database…\n')

  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'Payback Queue' } }],
    properties: {
      Name:           { title: {} },
      Amount:         { number: { format: 'dollar' } },
      Remaining:      { number: { format: 'dollar' } },
      'Source Bucket':{ rich_text: {} },
      Date:           { date: {} },
      Status:         { select: { options: [
        { name: 'Active',  color: 'red'   },
        { name: 'Repaid',  color: 'green' },
      ] } },
      Notes:          { rich_text: {} },
    },
  })

  console.log(`✓ Created: ${db.id}`)
  console.log('\nAdd this to your .env:\n')
  console.log(`NOTION_PAYBACK_DB=${db.id}\n`)
}

main().catch(err => {
  console.error('Setup failed:', err.message)
  if (err.body) console.error(JSON.stringify(err.body, null, 2))
  process.exit(1)
})
