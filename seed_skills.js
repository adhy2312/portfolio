require('dotenv').config();
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function seedSkills() {
  console.log("Seeding all 4 premium skill categories...");

  const frontendCategory = {
    _id: 'skill-frontend',
    _type: 'skillCategory',
    title: "Frontend Development",
    color: "#6c63ff",
    iconName: "FiMonitor",
    skills: [
      { _key: 's1', name: "React.js", level: 85 },
      { _key: 's2', name: "HTML5 & CSS3", level: 80 },
      { _key: 's3', name: "JavaScript (ES6+)", level: 70 },
      { _key: 's4', name: "Responsive Design", level: 70 },
      { _key: 's5', name: "Framer Motion", level: 75 }
    ]
  };

  const backendCategory = {
    _id: 'skill-backend',
    _type: 'skillCategory',
    title: "Backend & Databases",
    color: "#4fc3f7",
    iconName: "FiSettings",
    skills: [
      { _key: 's1', name: "Node.js & Express", level: 50 },
      { _key: 's2', name: "REST APIs", level: 40 },
      { _key: 's3', name: "MongoDB", level: 30 },
      { _key: 's4', name: "MySQL / SQLite", level: 40 },
      { _key: 's5', name: "Firebase", level: 60 }
    ]
  };

  const designCategory = {
    _id: 'skill-design',
    _type: 'skillCategory',
    title: "UI/UX & Design",
    color: "#f5a623",
    iconName: "FiPenTool",
    skills: [
      { _key: 's1', name: "Figma", level: 88 },
      { _key: 's2', name: "Prototyping", level: 82 },
      { _key: 's3', name: "Design Systems", level: 78 },
      { _key: 's4', name: "Adobe Photoshop", level: 50 },
      { _key: 's5', name: "Lightroom (Photo Edit)", level: 90 }
    ]
  };

  const iotCategory = {
    _id: 'skill-iot',
    _type: 'skillCategory',
    title: "Electronics & IoT",
    color: "#00e5a0",
    iconName: "FiZap",
    skills: [
      { _key: 's1', name: "Arduino", level: 50 },
      { _key: 's2', name: "STM32", level: 50 },
      { _key: 's3', name: "Circuit Design", level: 75 },
      { _key: 's4', name: "C", level: 72 },
      { _key: 's5', name: "Circuit Simulation", level: 78 }
    ]
  };

  try {
    const categories = [frontendCategory, backendCategory, designCategory, iotCategory];
    
    for (const cat of categories) {
      await client.createOrReplace(cat);
      console.log(`✅ Seeded skill category: ${cat.title} (${cat._id})`);
    }
    
    console.log("🎉 Seeding skills complete! Refresh your portfolio page.");
  } catch (error) {
    console.error("❌ Seeding skills failed:", error);
  }
}

seedSkills();
