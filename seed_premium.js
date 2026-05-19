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
  console.log("Seeding Sanity with Adhithya's premium custom content...");

  const heroDoc = {
    _id: 'hero',
    _type: 'hero',
    greeting: "Hey there!",
    name: "Adhithya Mohan",
    heading: "Full-Stack Developer & Creator",
    role: "Electronics Engineer | Web Developer | Photographer",
    bio: "Building responsive web apps and IoT solutions with modern tech stacks.",
    techStack: ["React", "Node.js", "Python", "STM32", "SupaBase"],
    resumeUrl: "/resume.pdf"
  };

  const aboutDoc = {
    _id: 'about',
    _type: 'about',
    location: "Kerala, India · Open to Remote & Relocation",
    bioParagraphs: [
      "I'm Adhithya Mohan, an Electronics and Communication Engineering (ECE) student and full-stack developer passionate about building impactful digital products. I blend engineering precision with creative design — from responsive web apps to embedded electronics systems.",
      "My skill set spans the full product lifecycle — ideating in Figma, building with React & Node.js, and extending to hardware with ESP32 & Arduino. I also bring a photographer's eye for detail to every UI I design.",
      "I'm driven by curiosity, constantly exploring new technologies, contributing to open source, and building things that matter."
    ],
    experienceYears: "2+",
    stats: [
      { _key: '1', label: "Years Learning", value: "3+", iconName: "FiCalendar" },
      { _key: '2', label: "Projects Built", value: "15+", iconName: "FiAward" },
      { _key: '3', label: "Designs Done · More on the way", value: "10+", iconName: "FiPenTool" },
      { _key: '4', label: "Tech Stacks", value: "10+", iconName: "FiAward" }
    ]
  };

  const footerDoc = {
    _id: 'footer',
    _type: 'footer',
    tagline: "Building digital experiences that matter — with code, design, and creativity.",
    email: "adhithyamohan2312@gmail.com",
    whatsapp: "919539066643",
    location: "Kerala, India",
    socialLinks: [
      { _key: 'soc1', platform: "LinkedIn", url: "https://www.linkedin.com/in/adhithya-mohan-s", iconName: "FiLinkedin" },
      { _key: 'soc2', platform: "GitHub", url: "https://github.com/adhy2312", iconName: "FiGithub" },
      { _key: 'soc3', platform: "Instagram", url: "https://instagram.com/zoomout_frames", iconName: "FiInstagram" },
      { _key: 'soc4', platform: "Email", url: "mailto:adhithyamohan2312@gmail.com", iconName: "FiMail" }
    ]
  };

  try {
    const docs = [heroDoc, aboutDoc, footerDoc];
    
    for (const doc of docs) {
      await client.createOrReplace(doc);
      console.log(`✅ Restored/Updated: ${doc._id} (${doc._type})`);
    }
    
    console.log("🎉 Premium data restoration complete! Refresh your web app and Sanity Studio.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seedData();
