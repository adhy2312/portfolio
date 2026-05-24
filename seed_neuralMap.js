const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'yur96h52', // Using default from previous seeds if missing
  dataset: 'production',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
  apiVersion: '2023-05-03',
});

const BRAIN_DATA = [
  {
    _type: 'neuralMap',
    nodeKey: 'frontend',
    color: '#00d2ff',
    icon: 'FiMonitor',
    projects: ['Living Portfolios', 'Interactive UI Systems', 'Scalable Architectures'],
    thoughts: ['Websites must feel alive', 'Balance aesthetics with performance'],
    experiments: ['Asynchronous APIs', 'Accessibility-focused UX'],
    failures: ['Overcomplicating state early on'],
    pos: [2.0, 2.0, 4.0]
  },
  {
    _type: 'neuralMap',
    nodeKey: 'spatial',
    color: '#aa00ff',
    icon: 'FiBox',
    projects: ['Three.js Holograms', 'WebGL Particle Systems', 'Digital Environments'],
    thoughts: ['Push beyond traditional layouts', 'Code as a creative medium'],
    experiments: ['Gesture-based interactions', 'Immersive 3D storytelling'],
    failures: ['Unoptimized render loops'],
    pos: [-2.0, 2.0, 4.0]
  },
  {
    _type: 'neuralMap',
    nodeKey: 'motion',
    color: '#ff0055',
    icon: 'FiWind',
    projects: ['Cinematic Transitions', 'Fluid Micro-interactions', 'Scroll-driven Worlds'],
    thoughts: ['Motion connects psychology & code', 'Ease-out makes it natural'],
    experiments: ['Framer Motion layout API', 'Physics-based animations'],
    failures: ['Sacrificing UX for flashy effects'],
    pos: [3.8, 1.5, 0]
  },
  {
    _type: 'neuralMap',
    nodeKey: 'media',
    color: '#ffaa00',
    icon: 'FiRadio',
    projects: ['ISTE PR Campaigns', 'AKSSC Media Strategy', 'FRAMES Visual Content'],
    thoughts: ['Communication is design', 'Brand consistency builds trust'],
    experiments: ['Campaign ideation', 'Event coordination systems'],
    failures: ['Underestimating data & spreadsheets'],
    pos: [-3.8, 1.5, 0]
  },
  {
    _type: 'neuralMap',
    nodeKey: 'photography',
    color: '#00ffaa',
    icon: 'FiCamera',
    projects: ['Portrait Photography', 'Event Coverage', 'Cinematic Framing'],
    thoughts: ['Preserve atmosphere over pixels', 'Lighting is the narrative'],
    experiments: ['Emotion-driven imagery', 'Visual hierarchy in frames'],
    failures: ['Missed focus on a fleeting moment'],
    pos: [2.0, -1.0, -4.0]
  },
  {
    _type: 'neuralMap',
    nodeKey: 'storytelling',
    color: '#ff00aa',
    icon: 'FiBookOpen',
    projects: ['Interactive Narratives', 'Hidden Easter Eggs', 'Emotion-driven UX'],
    thoughts: ['Connect multiple domains together', 'Tech should feel human'],
    experiments: ['Unconventional digital spaces', 'Jack-of-all-trades mindset'],
    failures: ['Forgetting the audience in the story'],
    pos: [-2.0, -1.0, -4.0]
  }
];

async function seed() {
  console.log('Clearing existing neural map nodes...');
  await client.delete({ query: '*[_type == "neuralMap"]' });

  console.log('Seeding new neural map nodes...');
  for (const doc of BRAIN_DATA) {
    const res = await client.create(doc);
    console.log(`Created node: ${res.nodeKey}`);
  }
  console.log('Seeding complete!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
});
