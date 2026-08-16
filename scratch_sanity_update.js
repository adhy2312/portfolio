const { createClient } = require('@sanity/client');
const fs = require('fs');
require('dotenv').config();

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function main() {
  const milestones = await client.fetch('*[_type == "milestone"] | order(order asc)');
  const experiences = await client.fetch('*[_type == "experience"] | order(order asc)');
  const achievements = await client.fetch('*[_type == "achievement"] | order(order asc)');

  const out = { milestones, experiences, achievements };
  fs.writeFileSync('sanity_current_dump.json', JSON.stringify(out, null, 2));
  console.log("Dumped Sanity data to sanity_current_dump.json");
}

main().catch(err => console.error("SANITY ERROR:", err));
