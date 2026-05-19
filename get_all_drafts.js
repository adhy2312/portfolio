const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function run() {
  const allDocs = await client.fetch('*');
  console.log("ALL DOCUMENT IDS IN SYSTEM:");
  console.log(JSON.stringify(allDocs.map(d => ({ id: d._id, type: d._type, updatedAt: d._updatedAt })), null, 2));
}

run().catch(console.error);
