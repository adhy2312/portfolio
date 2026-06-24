import fs from 'fs';

const projectId = 'uefti8ya';
const dataset = 'production';
const token = 'skmKooOgdssGcNS7YKy3HqoObdNQ78RKVN7SVau6WZQ9BbCuvN4ZxwXmbsBTicPK8VRtDVafG0fnRWHbPlwMoJvh7ksl4JE1WOHEUwhclmoPmHz1YMjApDVOiJ9qujAcQnmHmDm49uTyhiPsMD5muayPDtrlYyS6bQhBefwioxqI6zjoKpg7';

const projects = [
  {
    title: 'ISTE MBCET Portal',
    description:
      'A full-featured organizational portal for ISTE MBCET — built with Next.js and Sanity CMS. Features membership management, event listings, internship launchpad, and a premium glassmorphism UI.',
    tags: ['Next.js', 'Sanity CMS', 'Supabase', 'GSAP'],
    category: 'fullstack',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-primary)',
  },
  {
    title: 'Automated Certificate Gen',
    description:
      'A full-stack application designed to automate the generation and distribution of certificates. Features an intuitive dashboard to manage templates, user records, and bulk email delivery.',
    tags: ['React', 'Node.js', 'Express', 'Automation'],
    category: 'fullstack',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-purple)',
  },
  {
    title: 'Odoo - KiCad BOM Sync',
    description:
      'A specialized Python cron job that automatically synchronizes KiCad Bill of Materials (BOM) directly into Odoo. Automates sales order generation and manages inventory components seamlessly.',
    tags: ['Python', 'Odoo ERP', 'KiCad', 'Cron Job'],
    category: 'electronics',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-blue)',
  },
  {
    title: 'Smart Lighting System (IoT)',
    description:
      'An ESP32-based intelligent lighting controller that reacts to ambient light and motion. Features Bluetooth configuration, LDR sensor integration, and real-time PWM dimming.',
    tags: ['ESP32', 'Arduino', 'Embedded C', 'IoT'],
    category: 'electronics',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-green)',
  },
  {
    title: 'Portfolio Website',
    description:
      'This very portfolio — a premium, interactive full-stack app. Features an AI chatbot persona (Mini-Adhy) powered by Gemini, real-time Spotify "Now Playing" integration, infinite marquees, and dynamic content managed via Sanity CMS.',
    tags: ['React.js', 'Sanity CMS', 'Gemini API', 'Spotify API', 'GSAP'],
    category: 'fullstack',
    liveLink: 'https://portfolio-adhym.vercel.app/',
    githubLink: 'https://github.com/adhy2312/portfolio',
    accent: 'var(--accent-cyan)',
  },
  {
    title: 'Figma Design System',
    description:
      'A comprehensive UI kit and design system built in Figma — includes component library, color palette, typography scale, spacing grid, and interactive prototypes.',
    tags: ['Figma', 'UI/UX', 'Prototyping', 'Design System'],
    category: 'design',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-gold)',
  },
  {
    title: 'Photo Story Series',
    description:
      'A curated visual storytelling project capturing human emotion, urban textures, and golden-hour landscapes. Shot and edited using Adobe Lightroom.',
    tags: ['Photography', 'Lightroom', 'Street', 'Documentary'],
    category: 'photography',
    liveLink: 'https://www.instagram.com/zoomout_frames',
    githubLink: null,
    accent: 'var(--accent-magenta)',
  },
  {
    title: 'IoT Home Automation',
    description:
      'A wireless home automation prototype using NodeMCU and MQTT protocol. Control appliances via a custom-built React dashboard with real-time state sync.',
    tags: ['NodeMCU', 'MQTT', 'React', 'IoT'],
    category: 'electronics',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-green)',
    buildTime: 'Built during the 2021 lockdown',
    soundtrack: 'listening to lo-fi beats',
    emotionalNote: 'Debugging hardware over Wi-Fi taught me patience the hard way.'
  },
];

async function uploadToSanity() {
  const mutations = projects.map(project => ({
    create: {
      _type: 'project',
      ...project,
    }
  }));

  const payload = { mutations };

  const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/mutate/${dataset}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('Sanity response:', data);
  } catch (error) {
    console.error('Error uploading:', error);
  }
}

uploadToSanity();
