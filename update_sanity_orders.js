const https = require('https');
require('dotenv').config();

const projectId = process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya';
const dataset = process.env.REACT_APP_SANITY_DATASET || 'production';
const token = process.env.REACT_APP_SANITY_TOKEN;

function sanityQuery(groq) {
  return new Promise((resolve, reject) => {
    const url = `https://${projectId}.api.sanity.io/v2023-05-03/data/query/${dataset}?query=${encodeURIComponent(groq)}`;
    const req = https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
  });
}

function sanityMutate(mutations) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ mutations });
    const req = https.request({
      hostname: `${projectId}.api.sanity.io`,
      port: 443,
      path: `/v2023-05-03/data/mutate/${dataset}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const mRes = await sanityQuery('*[_type == "milestone"] | order(order asc)');
  const milestones = mRes.result || [];
  
  console.log("Current milestones count:", milestones.length);
  
  // Clean up order sequence: 1, 2, 3...
  const mutations = [];
  milestones.forEach((m, idx) => {
    const desiredOrder = idx + 1;
    if (m.order !== desiredOrder) {
      mutations.push({
        patch: {
          id: m._id,
          set: { order: desiredOrder }
        }
      });
    }
  });

  if (mutations.length > 0) {
    console.log(`Re-indexing ${mutations.length} milestone orders...`);
    const res = await sanityMutate(mutations);
    console.log("Re-indexing complete:", res.transactionId ? "SUCCESS" : res);
  } else {
    console.log("Milestone orders already clean.");
  }
}

run().catch(console.error);
