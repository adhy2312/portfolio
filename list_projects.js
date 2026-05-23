const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID,
  dataset: process.env.REACT_APP_SANITY_DATASET,
  token: process.env.REACT_APP_SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2023-05-03',
});

async function run() {
  const projects = await client.fetch(`*[_type == "project"] { _id, title }`);
  console.log("All projects:", projects);
}

run().catch(console.error);
