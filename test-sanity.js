require('dotenv').config();
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function testMutation() {
  try {
    const res = await client.create({
      _type: 'trustedBy',
      name: "Test Connection",
      order: 99
    });
    console.log("✅ Success! Created new document with auto-ID:", res._id);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testMutation();
