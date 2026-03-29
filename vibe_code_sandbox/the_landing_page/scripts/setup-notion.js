import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.resolve(__dirname, '../.env')

const notion = new Client({ auth: process.env.NOTION_TOKEN })

// ── Shared category / subcategory options ────────────────────────────────────
const CATEGORY_OPTIONS = [
  { name: 'Food', color: 'yellow' },
  { name: 'Health', color: 'green' },
  { name: 'Transport', color: 'brown' },
  { name: 'Shopping', color: 'orange' },
  { name: 'Bills & Subscriptions', color: 'gray' },
  { name: 'Gifts & Celebrations', color: 'pink' },
  { name: 'Travel', color: 'blue' },
  { name: 'Pending Matcha', color: 'green' },
  { name: 'Other', color: 'default' },
]

const SUBCATEGORY_OPTIONS = [
  { name: 'Hawker', color: 'yellow' },
  { name: 'Groceries', color: 'green' },
  { name: 'Cafe & Restaurants', color: 'orange' },
  { name: 'Drinks & Delivery', color: 'pink' },
  { name: 'Gym', color: 'blue' },
  { name: 'Bouldering', color: 'purple' },
  { name: 'Supplements', color: 'gray' },
  { name: 'Skincare', color: 'pink' },
  { name: 'Medical', color: 'red' },
]

// ── Database schemas ──────────────────────────────────────────────────────────

const DATABASES = [
  {
    envKey: 'NOTION_TRANSACTIONS_DB',
    title: 'Transactions',
    properties: {
      Title: { title: {} },
      Merchant: { rich_text: {} },
      Date: { date: {} },
      Amount: { number: { format: 'number' } },
      Direction: {
        select: {
          options: [
            { name: 'Income', color: 'green' },
            { name: 'Expense', color: 'red' },
          ],
        },
      },
      Category: { select: { options: CATEGORY_OPTIONS } },
      Subcategory: { select: { options: SUBCATEGORY_OPTIONS } },
      Source: {
        select: {
          options: [
            { name: 'DBS', color: 'red' },
            { name: 'PayLah', color: 'purple' },
            { name: 'YouTrip', color: 'blue' },
            { name: 'Cash', color: 'green' },
            { name: 'Other', color: 'default' },
          ],
        },
      },
      'Is Pending Matcha': { checkbox: {} },
      'Is Bucket Spend': { checkbox: {} },
      Notes: { rich_text: {} },
      'Auto Parsed': { checkbox: {} },
      'Needs Review': { checkbox: {} },
    },
  },
  {
    envKey: 'NOTION_BUDGETS_DB',
    title: 'Budgets',
    properties: {
      Category: { title: {} },
      'Monthly Limit': { number: { format: 'number' } },
      Type: {
        select: {
          options: [
            { name: 'Hard', color: 'red' },
            { name: 'Soft', color: 'yellow' },
          ],
        },
      },
      Active: { checkbox: {} },
    },
  },
  {
    envKey: 'NOTION_BUCKETS_DB',
    title: 'Savings Buckets',
    properties: {
      Name: { title: {} },
      Type: {
        select: {
          options: [
            { name: 'Permanent', color: 'blue' },
            { name: 'Temporary', color: 'yellow' },
            { name: 'Repayment', color: 'red' },
          ],
        },
      },
      'Target Amount': { number: { format: 'number' } },
      'Current Amount': { number: { format: 'number' } },
      'Monthly Top Up': { number: { format: 'number' } },
      'Target Date': { date: {} },
      Status: {
        select: {
          options: [
            { name: 'Active', color: 'green' },
            { name: 'Funded', color: 'blue' },
            { name: 'Spending', color: 'orange' },
            { name: 'Repaying', color: 'yellow' },
            { name: 'Completed', color: 'purple' },
            { name: 'Dissolved', color: 'gray' },
          ],
        },
      },
      'Amount Owed': { number: { format: 'number' } },
      'Monthly Repayment': { number: { format: 'number' } },
      Notes: { rich_text: {} },
    },
  },
  {
    envKey: 'NOTION_RECURRING_DB',
    title: 'Recurring Expenses',
    properties: {
      Name: { title: {} },
      Amount: { number: { format: 'number' } },
      Direction: {
        select: {
          options: [
            { name: 'Income',  color: 'green' },
            { name: 'Expense', color: 'red'   },
          ],
        },
      },
      Frequency: {
        select: {
          options: [
            { name: 'Monthly',   color: 'blue'   },
            { name: 'Annual',    color: 'green'  },
            { name: 'Quarterly', color: 'yellow' },
            { name: 'Irregular', color: 'gray'   },
          ],
        },
      },
      Merchant: { rich_text: {} },
      Category: { select: { options: CATEGORY_OPTIONS } },
      Subcategory: { select: { options: SUBCATEGORY_OPTIONS } },
      Source: { select: { options: [] } },
      Day: { number: { format: 'number' } },
      'Is Pending Matcha': { checkbox: {} },
      Notes: { rich_text: {} },
      'Next Due Date': { date: {} },
      Active: { checkbox: {} },
    },
  },
  {
    envKey: 'NOTION_UPCOMING_DB',
    title: 'Upcoming One-offs',
    properties: {
      Name: { title: {} },
      'Estimated Amount': { number: { format: 'number' } },
      'Due Date': { date: {} },
      Category: { select: { options: CATEGORY_OPTIONS } },
      Subcategory: { select: { options: SUBCATEGORY_OPTIONS } },
      'Repeat Yearly': { checkbox: {} },
      Notes: { rich_text: {} },
    },
  },
  {
    envKey: 'NOTION_CPF_DB',
    title: 'CPF Balances',
    properties: {
      Month: { title: {} },
      OA:    { number: { format: 'number' } },
      SA:    { number: { format: 'number' } },
      MA:    { number: { format: 'number' } },
      Total: { formula: { expression: 'prop("OA") + prop("SA") + prop("MA")' } },
      Type:  { select: { options: [
        { name: 'opening', color: 'gray' },
        { name: 'monthly', color: 'blue' },
      ] } },
    },
  },
  {
    envKey: 'NOTION_REVIEWS_DB',
    title: 'Monthly Reviews',
    properties: {
      Month: { title: {} },
      'Review Date': { date: {} },
      'Total Income': { number: { format: 'number' } },
      'Total Spent': { number: { format: 'number' } },
      'Bucket Draws': { number: { format: 'number' } },
      'Total Saved': { number: { format: 'number' } },
      Mood: {
        select: {
          options: [
            { name: 'Overwhelmed', color: 'red' },
            { name: 'Okay', color: 'yellow' },
            { name: 'Productive', color: 'blue' },
            { name: 'In the zone', color: 'green' },
          ],
        },
      },
      Notes: { rich_text: {} },
      Completed: { checkbox: {} },
      'Discoveries Actioned': { number: { format: 'number' } },
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createParentPage(parentPageId) {
  console.log('Creating "the_landing_page" child page under your parent page...')
  const page = await notion.pages.create({
    parent: { type: 'page_id', page_id: parentPageId },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: 'the_landing_page' } }],
      },
    },
  })
  console.log(`  ✓ Created page: ${page.id}`)
  return page.id
}

async function createDatabase(parentPageId, db) {
  console.log(`Creating database: ${db.title}...`)
  const response = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: db.title } }],
    properties: db.properties,
  })
  console.log(`  ✓ ${db.title}: ${response.id}`)
  return response.id
}

function writeEnvIds(ids) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''

  for (const [key, value] of Object.entries(ids)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`)
    } else {
      content += `\n${key}=${value}`
    }
  }

  // Ensure file ends with newline
  if (!content.endsWith('\n')) content += '\n'
  fs.writeFileSync(ENV_PATH, content)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.NOTION_TOKEN) {
    console.error('Error: NOTION_TOKEN is not set in .env')
    process.exit(1)
  }

  if (!process.env.NOTION_PARENT_PAGE_ID) {
    console.error('Error: NOTION_PARENT_PAGE_ID is not set in .env')
    console.error('  1. Create a page in Notion called "Life OS"')
    console.error('  2. Share it with your integration (Share → Invite → your integration)')
    console.error('  3. Copy the page ID from the URL and add to .env:')
    console.error('     NOTION_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    process.exit(1)
  }

  console.log('\n=== the_landing_page — Notion Setup ===\n')

  // 1. Create Life OS child page under the provided parent
  let lifeOsPageId
  try {
    lifeOsPageId = await createParentPage(process.env.NOTION_PARENT_PAGE_ID)
  } catch (err) {
    console.error('\nFailed to create the_landing_page page.')
    console.error('Make sure you shared the parent page with your integration.')
    console.error('Original error:', err.message)
    process.exit(1)
  }

  // 2. Create all databases
  const ids = {}
  for (const db of DATABASES) {
    ids[db.envKey] = await createDatabase(lifeOsPageId, db)
  }

  // 3. Print .env format
  console.log('\n=== Copy these into .env (also writing automatically) ===\n')
  for (const [key, value] of Object.entries(ids)) {
    console.log(`${key}=${value}`)
  }

  // 4. Write into .env
  writeEnvIds(ids)
  console.log('\n✓ Database IDs written to .env')
  console.log('\nSetup complete. Run "npm run dev" to start.\n')
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message)
  if (err.body) console.error('Notion error body:', JSON.stringify(err.body, null, 2))
  process.exit(1)
})
