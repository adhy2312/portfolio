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

async function run() {
  const hero = await client.fetch('*[_id == "hero"][0]');
  const about = await client.fetch('*[_id == "about"][0]');
  const footer = await client.fetch('*[_id == "footer"][0]');
  const experience = await client.fetch('*[_type == "experience"]');
  const skillCategory = await client.fetch('*[_type == "skillCategory"]');
  const trustedBy = await client.fetch('*[_type == "trustedBy"]');

  const output = {
    hero,
    about,
    footer,
    experience,
    skillCategory,
    trustedBy
  };

  fs.writeFileSync('db_output_utf8.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log("Written successfully to db_output_utf8.json!");
}

run().catch(console.error);
