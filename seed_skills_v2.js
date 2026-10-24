/**
 * seed_skills_v2.js
 * 
 * Seeds corrected, curated skill categories to Sanity CMS.
 * Run with: node seed_skills_v2.js
 *
 * This replaces old skill data with the restructured 8-category map.
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'uefti8ya',
  dataset: 'production',
  apiVersion: '2023-05-03',
  token: 'skmKooOgdssGcNS7YKy3HqoObdNQ78RKVN7SVau6WZQ9BbCuvN4ZxwXmbsBTicPK8VRtDVafG0fnRWHbPlwMoJvh7ksl4JE1WOHEUwhclmoPmHz1YMjApDVOiJ9qujAcQnmHmDm49uTyhiPsMD5muayPDtrlYyS6bQhBefwioxqI6zjoKpg7',
  useCdn: false,
});

const skillCategories = [
  {
    _type: 'skillCategory',
    _id: 'skill-cat-frontend',
    title: 'Frontend Development',
    iconName: 'FiMonitor',
    color: '#6366f1',
    order: 1,
    skills: [
      { _key: 'sk-react', name: 'React.js', level: 90 },
      { _key: 'sk-js', name: 'JavaScript (ES6+)', level: 88 },
      { _key: 'sk-ts', name: 'TypeScript', level: 78 },
      { _key: 'sk-html', name: 'HTML5 & CSS3', level: 92 },
      { _key: 'sk-next', name: 'Next.js', level: 82 },
      { _key: 'sk-tailwind', name: 'Tailwind CSS', level: 78 },
      { _key: 'sk-rwd', name: 'Responsive Web Design', level: 90 },
      { _key: 'sk-three', name: 'Three.js', level: 72 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-backend',
    title: 'Backend & Data',
    iconName: 'FiServer',
    color: '#06b6d4',
    order: 2,
    skills: [
      { _key: 'sk-node', name: 'Node.js', level: 80 },
      { _key: 'sk-express', name: 'Express.js', level: 78 },
      { _key: 'sk-restapi', name: 'REST APIs', level: 85 },
      { _key: 'sk-python', name: 'Python', level: 88 },
      { _key: 'sk-postgres', name: 'PostgreSQL', level: 84 },
      { _key: 'sk-firebase', name: 'Firebase', level: 85 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-ai',
    title: 'AI & Automation',
    iconName: 'FiCpu',
    color: '#a855f7',
    order: 3,
    skills: [
      { _key: 'sk-pyauto', name: 'Python Automation', level: 92 },
      { _key: 'sk-aidev', name: 'AI-Assisted Development', level: 90 },
      { _key: 'sk-aiagents', name: 'AI Agents', level: 82 },
      { _key: 'sk-aiapi', name: 'AI API Integration', level: 85 },
      { _key: 'sk-workflow', name: 'Workflow Automation', level: 88 },
      { _key: 'sk-scrape', name: 'Web Scraping', level: 86 },
      { _key: 'sk-yolo', name: 'YOLOv8', level: 75 },
      { _key: 'sk-prompt', name: 'Prompt Engineering', level: 82 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-iot',
    title: 'Electronics & IoT',
    iconName: 'FiZap',
    color: '#10b981',
    order: 4,
    skills: [
      { _key: 'sk-arduino', name: 'Arduino', level: 92 },
      { _key: 'sk-esp32', name: 'ESP32', level: 90 },
      { _key: 'sk-embedded', name: 'Embedded Systems', level: 82 },
      { _key: 'sk-iot', name: 'IoT', level: 88 },
      { _key: 'sk-mcu', name: 'Microcontroller Programming', level: 82 },
      { _key: 'sk-circuit', name: 'Circuit Design', level: 85 },
      { _key: 'sk-sensor', name: 'Sensor Interfacing', level: 85 },
      { _key: 'sk-pcb', name: 'PCB Design', level: 84 },
      { _key: 'sk-proto', name: 'Electronics Prototyping', level: 90 },
      { _key: 'sk-kicad', name: 'KiCad', level: 86 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-erp',
    title: 'ERP & Engineering Systems',
    iconName: 'FiLayers',
    color: '#3b82f6',
    order: 5,
    skills: [
      { _key: 'sk-odoo', name: 'Odoo ERP', level: 88 },
      { _key: 'sk-odooCustom', name: 'Odoo Customization', level: 85 },
      { _key: 'sk-erpworkflow', name: 'ERP Workflow Automation', level: 86 },
      { _key: 'sk-bom', name: 'BOM Automation', level: 82 },
      { _key: 'sk-odoKicad', name: 'Odoo-KiCad Integration', level: 80 },
      { _key: 'sk-engworkflow', name: 'Engineering Workflow Automation', level: 84 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-design',
    title: 'UI/UX & Design',
    iconName: 'FiPenTool',
    color: '#f59e0b',
    order: 6,
    skills: [
      { _key: 'sk-figma', name: 'Figma', level: 92 },
      { _key: 'sk-uiux', name: 'UI/UX Design', level: 88 },
      { _key: 'sk-proto2', name: 'Prototyping & Wireframing', level: 90 },
      { _key: 'sk-ds', name: 'Design Systems', level: 85 },
      { _key: 'sk-visual', name: 'Visual Design', level: 88 },
      { _key: 'sk-interact', name: 'Interaction Design', level: 82 },
      { _key: 'sk-ps', name: 'Adobe Photoshop', level: 80 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-photo',
    title: 'Photography & Media',
    iconName: 'FiCamera',
    color: '#f43f5e',
    order: 7,
    skills: [
      { _key: 'sk-photo', name: 'Photography', level: 96 },
      { _key: 'sk-event', name: 'Event Photography', level: 92 },
      { _key: 'sk-portrait', name: 'Portrait Photography', level: 94 },
      { _key: 'sk-street', name: 'Street Photography', level: 90 },
      { _key: 'sk-nature', name: 'Nature Photography', level: 92 },
      { _key: 'sk-photoedit', name: 'Photo Editing', level: 95 },
      { _key: 'sk-storytell', name: 'Visual Storytelling', level: 92 },
      { _key: 'sk-creative', name: 'Creative Direction', level: 88 },
      { _key: 'sk-poster', name: 'Poster Design', level: 86 },
      { _key: 'sk-social', name: 'Social Media Design', level: 90 },
      { _key: 'sk-brand', name: 'Branding', level: 85 },
    ],
  },
  {
    _type: 'skillCategory',
    _id: 'skill-cat-tools',
    title: 'Tools & Workflow',
    iconName: 'FiTerminal',
    color: '#ec4899',
    order: 8,
    skills: [
      { _key: 'sk-git', name: 'Git', level: 90 },
      { _key: 'sk-github', name: 'GitHub', level: 92 },
      { _key: 'sk-vscode', name: 'VS Code', level: 94 },
      { _key: 'sk-vercel', name: 'Vercel', level: 88 },
      { _key: 'sk-wokwi', name: 'Wokwi', level: 85 },
    ],
  },
];

async function seedSkills() {
  console.log('Seeding skill categories...\n');

  const existing = await client.fetch('*[_type == "skillCategory"]._id');
  if (existing.length > 0) {
    console.log(`Removing ${existing.length} existing skill categories...`);
    const deletions = existing.map(id => ({ delete: { id } }));
    await client.mutate(deletions);
    console.log('Old categories removed.\n');
  }

  const mutations = skillCategories.map(cat => ({ createOrReplace: cat }));
  await client.mutate(mutations);

  console.log(`Seeded ${skillCategories.length} skill categories:`);
  skillCategories.forEach((cat, i) => {
    console.log(`   ${i + 1}. ${cat.title} (${cat.skills.length} skills)`);
  });
  console.log('\nDone! Skills are live on Sanity.');
}

seedSkills().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
