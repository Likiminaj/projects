/**
 * Adds a Day (number) property to the existing Birthdays Notion database.
 * Run once: node scripts/migrate-birthdays-add-day.js
 */
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'

dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function main() {
  const dbId = process.env.NOTION_BIRTHDAYS_DB
  if (!dbId) {
    console.error('NOTION_BIRTHDAYS_DB not set in .env')
    process.exit(1)
  }

  // Check if Day already exists
  const db = await notion.databases.retrieve({ database_id: dbId })
  if (db.properties['Day']) {
    console.log('Day property already exists — nothing to do.')
    return
  }

  await notion.databases.update({
    database_id: dbId,
    properties: {
      Day: { number: { format: 'number' } },
    },
  })

  console.log('✓ Day property added to Birthdays DB')
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
