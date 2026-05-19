require('dotenv').config();
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function seedData() {
  console.log("Seeding Sanity with initial portfolio data...");

  const heroDoc = {
    _id: 'hero',
    _type: 'hero',
    greeting: "Hey there!",
    name: "Adhithya Mohan",
    heading: "Full-Stack Developer & Creator",
    role: "Electronics Engineer | Web Developer | Photographer",
    bio: "Building responsive web apps and IoT solutions with modern tech stacks.",
    techStack: ["React", "Node.js", "Python", "STM32", "SupaBase"],
    resumeUrl: "https://example.com/resume.pdf"
  };

  const aboutDoc = {
    _id: 'about',
    _type: 'about',
    location: "Kerala, India",
    bioParagraphs: [
      "I'm a passionate full-stack developer and electronics engineer based in Kerala. I love building high-performance web applications and IoT solutions.",
      "When I'm not coding, I'm usually behind a camera capturing moments, or tinkering with hardware circuits."
    ],
    experienceYears: "3+",
    stats: [
      { _key: '1', label: "Projects Completed", value: "20+", iconName: "FiCheckCircle" },
      { _key: '2', label: "Happy Clients", value: "10+", iconName: "FiUsers" },
      { _key: '3', label: "Years Experience", value: "3+", iconName: "FiClock" }
    ]
  };

  const skill1 = {
    _id: 'skill-frontend',
    _type: 'skillCategory',
    title: "Frontend Development",
    color: "#CBA6F7",
    iconName: "FiMonitor",
    skills: [
      { _key: 's1', name: "React / Next.js", level: 90 },
      { _key: 's2', name: "JavaScript / TypeScript", level: 85 },
      { _key: 's3', name: "CSS / Framer Motion", level: 80 }
    ]
  };

  const skill2 = {
    _id: 'skill-backend',
    _type: 'skillCategory',
    title: "Backend & Systems",
    color: "#89DCEB",
    iconName: "FiServer",
    skills: [
      { _key: 's4', name: "Node.js / Express", level: 85 },
      { _key: 's5', name: "Python", level: 80 },
      { _key: 's6', name: "MongoDB / SQL", level: 75 }
    ]
  };

  const trusted1 = { _id: 'trusted-1', _type: 'trustedBy', name: "ISTE MBCET", order: 1 };
  const trusted2 = { _id: 'trusted-2', _type: 'trustedBy', name: "FRAMES MBCET", order: 2 };
  const trusted3 = { _id: 'trusted-3', _type: 'trustedBy', name: "Vercel", order: 3 };
  const trusted4 = { _id: 'trusted-4', _type: 'trustedBy', name: "Figma", order: 4 };

  const footerDoc = {
    _id: 'footer',
    _type: 'footer',
    tagline: "Let's build something amazing together.",
    email: "hello@adhithyamohan.com",
    whatsapp: "+91 9876543210",
    location: "Kerala, India",
    socialLinks: [
      { _key: 'soc1', platform: "GitHub", url: "https://github.com", iconName: "FiGithub" },
      { _key: 'soc2', platform: "LinkedIn", url: "https://linkedin.com", iconName: "FiLinkedin" }
    ]
  };

  try {
    const docs = [heroDoc, aboutDoc, skill1, skill2, trusted1, trusted2, trusted3, trusted4, footerDoc];
    
    for (const doc of docs) {
      await client.createOrReplace(doc);
      console.log(`✅ Created/Updated: ${doc._id} (${doc._type})`);
    }
    
    console.log("🎉 Seeding complete! Check your Sanity Studio at /studio.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seedData();
