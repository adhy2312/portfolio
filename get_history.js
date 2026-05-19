const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function getHistory(docId) {
  try {
    console.log(`\n=========================================`);
    console.log(`Fetching history for document: ${docId}`);
    console.log(`=========================================`);

    // Fetch the transactions
    const url = `/data/history/production/transactions/${docId}`;
    const result = await client.request({ url, method: 'GET' });
    
    // The result is an NDJSON or JSON of transactions
    // Let's parse and list them
    const transactions = Array.isArray(result) ? result : (typeof result === 'string' ? result.trim().split('\n').map(JSON.parse) : []);
    
    console.log(`Found ${transactions.length} transactions.`);
    
    // Display the last few transactions
    const count = Math.min(transactions.length, 10);
    for (let i = 0; i < count; i++) {
      const tx = transactions[transactions.length - 1 - i];
      if (!tx) continue;
      
      console.log(`\n[Revision #${i + 1}]`);
      console.log(`Transaction ID: ${tx.id}`);
      console.log(`Timestamp: ${tx.timestamp}`);
      console.log(`Author: ${tx.author}`);
      
      // Fetch the document at this revision
      try {
        const revDoc = await client.request({
          url: `/data/history/production/documents/${docId}?revision=${tx.id}`,
          method: 'GET'
        });
        console.log("Document state at this revision:");
        console.log(JSON.stringify(revDoc, null, 2));
      } catch (err) {
        console.log(`Could not fetch revision: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`Error fetching history for ${docId}:`, err.message);
  }
}

async function run() {
  await getHistory('hero');
  await getHistory('about');
}

run();
