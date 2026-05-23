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
  // Find the project
  const projects = await client.fetch(`*[_type == "project" && title match "Portfolio"]`);
  
  if (projects.length === 0) {
    console.log("No portfolio project found.");
    return;
  }

  const portfolioId = projects[0]._id;
  console.log(`Found portfolio project: ${projects[0].title} (${portfolioId})`);

  // Update it
  const res = await client.patch(portfolioId)
    .set({
      githubLink: 'https://github.com/adhy2312/portfolio',
      liveLink: 'https://portfolio-adhym.vercel.app/',
      tags: [
        'React.js', 
        'Sanity CMS', 
        'Framer Motion', 
        'Gemini AI', 
        'Spotify API',
        'Vanilla CSS',
        'Intersection Observer'
      ],
      description: 'A premium, interactive personal portfolio website. Features an AI chatbot persona (Mini-Adhy) powered by Gemini, real-time Spotify "Now Playing" integration, fully custom animations with Framer Motion, and infinite marquees. All content dynamically managed via Sanity Headless CMS.'
    })
    .commit();

  console.log("Successfully updated portfolio project in Sanity!", res);
}

run().catch(console.error);
