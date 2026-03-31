/**
 * Adds Type (select) and Month (number) columns to the existing Recurring DB.
 * Run once: node scripts/migrate-recurring-schema.js
 */
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function main() {
  const dbId = process.env.NOTION_RECURRING_DB
  if (!dbId) { console.error('NOTION_RECURRING_DB not set in .env'); process.exit(1) }

  console.log(`\nMigrating Recurring DB: ${dbId}\n`)

  // Read current schema
  const db = await notion.databases.retrieve({ database_id: dbId })
  const existing = new Set(Object.keys(db.properties))

  const updates = {}

  if (!existing.has('Type')) {
    updates.Type = {
      select: {
        options: [
          { name: 'Fixed',   color: 'purple' },
          { name: 'Planned', color: 'yellow' },
        ],
      },
    }
    console.log('  + Adding Type select (Fixed / Planned)')
  } else {
    console.log('  ✓ Type already exists')
  }

  if (!existing.has('Month')) {
    updates.Month = { number: { format: 'number' } }
    console.log('  + Adding Month number (1–12 for yearly items)')
  } else {
    console.log('  ✓ Month already exists')
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
