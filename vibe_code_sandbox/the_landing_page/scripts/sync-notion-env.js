import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.resolve(__dirname, '../.env')
const notion = new Client({ auth: process.env.NOTION_TOKEN })

const DATABASES = [
  { envKey: 'NOTION_TRANSACTIONS_DB', titles: ['Transactions'] },
  { envKey: 'NOTION_RECURRING_DB', titles: ['Recurring Expenses'] },
  { envKey: 'NOTION_BUDGETS_DB', titles: ['Budgets'] },
  { envKey: 'NOTION_BUCKETS_DB', titles: ['Savings Buckets'] },
  { envKey: 'NOTION_UPCOMING_DB', titles: ['Upcoming One-offs'] },
  { envKey: 'NOTION_REVIEWS_DB', titles: ['Monthly Reviews'] },
  { envKey: 'NOTION_CPF_DB', titles: ['CPF Balances'] },
  { envKey: 'NOTION_CATEGORIES_DB', titles: ['Category', 'Categories'] },
  { envKey: 'NOTION_REDUCTION_PLANS_DB', titles: ['Reduction Plans', 'Spend Reduction Plans'] },
  { envKey: 'NOTION_REDUCTION_LINES_DB', titles: ['Reduction Lines', 'Spend Reduction Lines'] },
  { envKey: 'NOTION_PAYBACK_DB', titles: ['Payback'] },
  { envKey: 'NOTION_ACCOUNTS_DB', titles: ['Accounts'] },
  { envKey: 'NOTION_BIRTHDAYS_DB', titles: ['Birthdays'] },
  { envKey: 'NOTION_TASKS_DB', titles: ['Tasks'] },
  { envKey: 'NOTION_HABIT_LOGS_DB', titles: ['Habit Logs'] },
  { envKey: 'NOTION_HABITS_DB', titles: ['Habits'] },
]

function normalizeTitle(title = '') {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function writeEnv(updates) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''

  for (const [key, value] of updates) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`)
    } else {
      if (content && !content.endsWith('\n')) content += '\n'
      content += `${key}=${value}\n`
    }
  }

  if (content && !content.endsWith('\n')) content += '\n'
  fs.writeFileSync(ENV_PATH, content)
}

async function listChildBlocks(blockId) {
  const blocks = []
  let cursor

  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    blocks.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)

  return blocks
}

async function collectDatabases(blockId, found = new Map(), visited = new Set()) {
  if (visited.has(blockId)) return found
  visited.add(blockId)

  for (const block of await listChildBlocks(blockId)) {
    if (block.type === 'child_database') {
      const title = block.child_database?.title ?? ''
      found.set(normalizeTitle(title), { id: block.id, title })
      continue
    }

    if (block.type === 'child_page') {
      await collectDatabases(block.id, found, visited)
    }
  }

  return found
}

export async function main() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN is not set in .env')
  }

  if (!process.env.NOTION_PARENT_PAGE_ID) {
    throw new Error('NOTION_PARENT_PAGE_ID is not set in .env')
  }

  console.log('\nSyncing Notion database IDs into .env...\n')

  const databases = await collectDatabases(process.env.NOTION_PARENT_PAGE_ID)
  const updates = []
  const missing = []

  for (const { envKey, titles } of DATABASES) {
    const entry = titles
      .map((title) => databases.get(normalizeTitle(title)))
      .find(Boolean)

    if (entry) {
      updates.push([envKey, entry.id])
    } else {
      missing.push(`${titles.join(' / ')} -> ${envKey}`)
    }
  }

  if (updates.length === 0) {
    throw new Error('No databases were found under the provided page')
  }

  writeEnv(updates)

  console.log('Updated .env with:')
  for (const [key, value] of updates) {
    console.log(`  ${key}=${value}`)
  }

  if (missing.length > 0) {
    console.log('\nMissing databases:')
    for (const item of missing) {
      console.log(`  ${item}`)
    }
  }

  console.log('\nDone. Restart the server after updating .env.\n')
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false

if (isDirectRun) {
  main().catch((err) => {
    console.error('Sync failed:', err.message)
    process.exit(1)
  })
}
