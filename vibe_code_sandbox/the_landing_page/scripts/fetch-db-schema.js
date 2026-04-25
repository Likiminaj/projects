import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const dbs = {
  TRANSACTIONS_DB: process.env.NOTION_TRANSACTIONS_DB,
  BUDGETS_DB: process.env.NOTION_BUDGETS_DB,
  BUCKETS_DB: process.env.NOTION_BUCKETS_DB,
  RECURRING_DB: process.env.NOTION_RECURRING_DB,
  UPCOMING_DB: process.env.NOTION_UPCOMING_DB,
  REVIEWS_DB: process.env.NOTION_REVIEWS_DB,
  CPF_DB: process.env.NOTION_CPF_DB,
  REDUCTION_PLANS_DB: process.env.NOTION_REDUCTION_PLANS_DB,
  REDUCTION_LINES_DB: process.env.NOTION_REDUCTION_LINES_DB,
  BIRTHDAYS_DB: process.env.NOTION_BIRTHDAYS_DB,
  ACCOUNTS_DB: process.env.NOTION_ACCOUNTS_DB,
  TASKS_DB: process.env.NOTION_TASKS_DB,
  CATEGORIES_DB: process.env.NOTION_CATEGORIES_DB,
};

async function fetchSchema() {
  for (const [name, id] of Object.entries(dbs)) {
    if (!id) {
      console.log(`\n${name}: NOT SET`);
      continue;
    }
    try {
      const response = await notion.databases.retrieve({ database_id: id });
      console.log(`\n${name} (${id}):`);
      const props = response.properties;
      for (const [propName, prop] of Object.entries(props)) {
        console.log(`  - ${propName}: ${prop.type}`);
      }
    } catch (e) {
      console.log(`\n${name}: ERROR - ${e.message}`);
    }
  }
}

fetchSchema();