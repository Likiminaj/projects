/**
 * setup-cpf.js
 * Creates the CPF Balances database and seeds the opening entry.
 * Run once: node scripts/setup-cpf.js
 */

import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH  = path.resolve(__dirname, '../.env')

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const SEED = { month: '2026-02', oa: 48055.33, sa: 14388.31, ma: 15780.75 }

async function run() {
  if (!process.env.NOTION_TOKEN)        { console.error('NOTION_TOKEN not set'); process.exit(1) }
  if (!process.env.NOTION_PARENT_PAGE_ID) { console.error('NOTION_PARENT_PAGE_ID not set'); process.exit(1) }

  if (process.env.NOTION_CPF_DB) {
    console.log(`CPF DB already exists: ${process.env.NOTION_CPF_DB}`)
    console.log('Delete NOTION_CPF_DB from .env and re-run to recreate.')
    process.exit(0)
  }

  // 1. Create database
  console.log('Creating CPF Balances database…')
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'CPF Balances' } }],
    properties: {
      Month: { title: {} },
      OA:    { number: { format: 'number' } },
      SA:    { number: { format: 'number' } },
      MA:    { number: { format: 'number' } },
      Total: { formula: { expression: 'prop("OA") + prop("SA") + prop("MA")' } },
    },
  })
  console.log(`  ✓ Created: ${db.id}`)

  // 2. Write ID to .env
  let env = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  if (/^NOTION_CPF_DB=/m.test(env)) {
    env = env.replace(/^NOTION_CPF_DB=.*$/m, `NOTION_CPF_DB=${db.id}`)
  } else {
    env += `\nNOTION_CPF_DB=${db.id}\n`
  }
  fs.writeFileSync(ENV_PATH, env)
  console.log('  ✓ NOTION_CPF_DB written to .env')

  // 3. Seed opening balance
  console.log(`Seeding opening balance for ${SEED.month}…`)
  await notion.pages.create({
    parent: { database_id: db.id },
    properties: {
      Month: { title: [{ text: { content: SEED.month } }] },
      OA:    { number: SEED.oa },
      SA:    { number: SEED.sa },
      MA:    { number: SEED.ma },
    },
  })
  console.log(`  ✓ Seeded ${SEED.month}: OA ${SEED.oa} · SA ${SEED.sa} · MA ${SEED.ma}`)
  console.log('\nDone. Restart the server.\n')
}

run().catch(err => { console.error(err.message); process.exit(1) })
