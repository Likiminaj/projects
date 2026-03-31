/**
 * Adds Active From and Active Until (rich_text) columns to the Recurring DB.
 * Run once: node scripts/migrate-recurring-active-period.js
 */
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function main() {
  const dbId = process.env.NOTION_RECURRING_DB
  if (!dbId) { console.error('NOTION_RECURRING_DB not set in .env'); process.exit(1) }

  console.log(`\nMigrating Recurring DB: ${dbId}\n`)

  const db       = await notion.databases.retrieve({ database_id: dbId })
  const existing = new Set(Object.keys(db.properties))
  const updates  = {}

  if (!existing.has('Active From')) {
    updates['Active From'] = { rich_text: {} }
    console.log('  + Adding Active From (rich_text, stores YYYY-MM)')
  } else {
    console.log('  ✓ Active From already exists')
  }

  if (!existing.has('Active Until')) {
    updates['Active Until'] = { rich_text: {} }
    console.log('  + Adding Active Until (rich_text, stores YYYY-MM)')
  } else {
    console.log('  ✓ Active Until already exists')
  }

  if (Object.keys(updates).length === 0) {
    console.log('\nNothing to do — schema already up to date.\n')
    return
  }

  await notion.databases.update({ database_id: dbId, properties: updates })
  console.log('\n✓ Migration complete.\n')
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  if (err.body) console.error(JSON.stringify(err.body, null, 2))
  process.exit(1)
})
