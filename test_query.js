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
  const types = ['project', 'achievement', 'photo', 'testimonial', 'contact'];
  for (const t of types) {
    const data = await client.fetch(`*[_type == "${t}"]`);
    console.log(`Type: ${t}, Count: ${data.length}`);
    if (data.length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

run().catch(console.error);
