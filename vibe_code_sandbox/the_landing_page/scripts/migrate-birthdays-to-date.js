/**
 * Replaces Month (number) + Day (number) with a single Date (date) property
 * on the Birthdays Notion database.
 * Run once: node scripts/migrate-birthdays-to-date.js
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

  const db = await notion.databases.retrieve({ database_id: dbId })
  const hasDate  = !!db.properties['Date']
  const hasMonth = !!db.properties['Month']
  const hasDay   = !!db.properties['Day']

  if (hasDate && !hasMonth && !hasDay) {
    console.log('Already migrated — nothing to do.')
    return
  }

  await notion.databases.update({
    database_id: dbId,
    properties: {
      ...(hasDate  ? {} : { Date: { date: {} } }),
      ...(hasMonth ? { Month: null } : {}),
      ...(hasDay   ? { Day:   null } : {}),
    },
  })

  console.log('✓ Date property added; Month and Day removed from Birthdays DB')
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
