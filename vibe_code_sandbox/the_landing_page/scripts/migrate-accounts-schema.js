/**
 * Adds optional liability support to the Accounts database.
 * Run once: node scripts/migrate-accounts-schema.js
 */
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'

dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function main() {
  const dbId = process.env.NOTION_ACCOUNTS_DB
  if (!dbId) {
    console.error('NOTION_ACCOUNTS_DB not set in .env')
    process.exit(1)
  }

  console.log(`\nMigrating Accounts DB: ${dbId}\n`)
  const db = await notion.databases.retrieve({ database_id: dbId })
  const existing = db.properties ?? {}
  const updates = {}

  if (!existing['Credit Limit']) {
    updates['Credit Limit'] = { number: { format: 'number' } }
    console.log('  + Adding Credit Limit number')
  } else {
    console.log('  ✓ Credit Limit already exists')
  }

  const typeProp = existing.Type
  if (typeProp?.type === 'select') {
    const options = typeProp.select?.options ?? []
    const names = new Set(options.map(opt => opt.name))
    const nextOptions = [...options]
    if (!names.has('Credit Card')) nextOptions.push({ name: 'Credit Card', color: 'red' })
    if (!names.has('Loan')) nextOptions.push({ name: 'Loan', color: 'orange' })
    if (nextOptions.length !== options.length) {
      updates.Type = { select: { options: nextOptions } }
      console.log('  + Adding liability type options')
    } else {
      console.log('  ✓ Liability type options already exist')
    }
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
