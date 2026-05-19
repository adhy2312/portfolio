const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
});

async function run() {
  const data = await client.fetch('*[_type == "experience"]');
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
