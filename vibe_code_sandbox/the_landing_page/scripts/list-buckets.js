import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const res = await notion.databases.query({ 
  database_id: process.env.NOTION_BUCKETS_DB, 
  page_size: 100 
});

console.log('Current buckets:');
res.results.forEach(p => {
  const name = p.properties.Name?.title?.[0]?.plain_text ?? 'Unnamed';
  const current = p.properties['Current Amount']?.number ?? 0;
  const target = p.properties['Target Amount']?.number ?? 0;
  console.log(`  ${name}: ${current} / ${target}`);
});