require('dotenv').config();
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});

async function seedMediaSecretary() {
  console.log('🚀 Starting Sanity seed: Media Secretary of MBCET Senate...\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ACHIEVEMENTS (Highlights section) — Add Media Secretary card
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📌 Seeding Achievements (Highlights)...');
  const achievementDocs = [
    {
      _id: 'ach-media-secretary',
      _type: 'achievement',
      title: 'Media Secretary, MBCET Senate',
      desc: 'Nominated and selected as Media Secretary of the MBCET Senate — one of the highest student governance positions at the college. Responsible for official campus communications, digital media strategy, press coverage, and representing student media at the institutional level.',
      accent: 'var(--accent-primary)',
      iconName: 'FiGlobe',
      order: 1,
    },
    {
      _id: 'ach-finance-club',
      _type: 'achievement',
      title: 'Co-Founder, Finance Club MBCET',
      desc: 'Co-Founded the Finance Club at MBCET and serving as Director of External Affairs — building financial literacy, forging industry partnerships, and driving campus-wide economic awareness.',
      accent: 'var(--accent-primary)',
      iconName: 'FiAward',
      order: 2,
    },
    {
      _id: 'ach-iot',
      _type: 'achievement',
      title: 'IoT Projects',
      desc: 'Designed and shipped multiple embedded systems projects using ESP32 and Arduino for real-world problems.',
      accent: 'var(--accent-green)',
      iconName: 'FiZap',
      order: 3,
    },
    {
      _id: 'ach-figma',
      _type: 'achievement',
      title: 'Figma Designer',
      desc: 'Built polished design systems and prototypes for web apps — from wireframes to production-ready UI.',
      accent: 'var(--accent-gold)',
      iconName: 'FiPenTool',
      order: 4,
    },
    {
      _id: 'ach-photographer',
      _type: 'achievement',
      title: 'Photographer',
      desc: 'Running @zoomout_frames on Instagram — passionate street, portrait, and nature photographer.',
      accent: 'var(--accent-cyan)',
      iconName: 'FiCamera',
      order: 5,
    },
    {
      _id: 'ach-fullstack',
      _type: 'achievement',
      title: 'Full-Stack Dev',
      desc: 'Built end-to-end web apps with React, Node.js, and MongoDB — from database design to pixel-perfect UIs.',
      accent: 'var(--accent-magenta)',
      iconName: 'FiGlobe',
      order: 6,
    },
    {
      _id: 'ach-ece',
      _type: 'achievement',
      title: 'ECE Student',
      desc: 'Pursuing Electronics and Communication Engineering (ECE) with a passion for blending hardware design with modern software.',
      accent: '#ff6b9d',
      iconName: 'FiBookOpen',
      order: 7,
    },
  ];

  for (const doc of achievementDocs) {
    try {
      await client.createOrReplace(doc);
      console.log(`  ✅ Achievement: ${doc.title}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${doc.title}`, err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MILESTONES (Timeline section) — Full timeline with Media Secretary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📌 Seeding Milestones (Timeline)...');
  const milestoneDocs = [
    {
      _id: 'milestone-12th',
      _type: 'milestone',
      order: 1,
      year: '2024',
      title: 'Completed 12th Std',
      description: 'Graduated higher secondary education with a strong foundation in science.',
      memory: '"Every ending is just a new stack frame."',
    },
    {
      _id: 'milestone-mbcet-start',
      _type: 'milestone',
      order: 2,
      year: '2024',
      title: 'Started Engineering at MBCET',
      description: 'Embarked on B.Tech journey in Electronics and Communication Engineering.',
      memory: '"The first line of code I wrote at MBCET was a blinking LED. The rest is still compiling."',
    },
    {
      _id: 'milestone-frames-join',
      _type: 'milestone',
      order: 3,
      year: '2024',
      title: 'Joined FRAMES MBCET',
      description: 'Became a member of the official photography club — started seeing the world through a lens.',
      memory: '"f/1.8 and a dream. That\'s how it started."',
    },
    {
      _id: 'milestone-sem1',
      _type: 'milestone',
      order: 4,
      year: '2025',
      title: 'Completed 1st Semester',
      description: 'Survived the first semester. Learned that electronics and coffee are deeply correlated.',
      memory: '"Sleep(0) is not a valid coping mechanism."',
    },
    {
      _id: 'milestone-iste-join',
      _type: 'milestone',
      order: 5,
      year: '2025',
      title: 'Joined ISTE SC MBCET',
      description: 'Selected as PR and Media Junior Execom member. Learned that storytelling is engineering too.',
      memory: '"The best PR is code that speaks for itself."',
    },
    {
      _id: 'milestone-sem2',
      _type: 'milestone',
      order: 6,
      year: '2025',
      title: 'Completed 2nd Semester',
      description: 'Finished freshman year of engineering. The circuit diagrams started making sense.',
      memory: '"First PCB burned. Third one actually worked. Still counts."',
    },
    {
      _id: 'milestone-creative-curator',
      _type: 'milestone',
      order: 7,
      year: '2025',
      title: 'Promoted as Creative Curator',
      description: 'Elevated to Creative Curator at FRAMES MBCET — curating visual stories for the campus.',
      memory: '"A photo isn\'t taken. It\'s designed at 1/500th of a second."',
    },
    {
      _id: 'milestone-pr-head',
      _type: 'milestone',
      order: 8,
      year: '2025',
      title: 'PR & Media Head at ISTE',
      description: 'Elevated to PR and Media Head at ISTE SC MBCET. First real leadership role — built the digital voice of the chapter.',
      memory: '"Being a head means your mistakes have a press release now."',
    },
    {
      _id: 'milestone-nexora',
      _type: 'milestone',
      order: 9,
      year: '2026',
      title: 'Media Head & Core Coordinator',
      description: "Led media for NEXORA 26' — the 24th All Kerala ISTE Annual Student State Convention.",
      memory: '"600 students. 48 hours. One Wi-Fi router. We survived."',
    },
    {
      _id: 'milestone-chairperson',
      _type: 'milestone',
      order: 10,
      year: '2026',
      title: 'Elected Chairperson, ISTE SC MBCET',
      description: 'Elected Chairperson of the ISTE Student Chapter at MBCET. Led 300+ members, drove technical events, and shaped the future of the chapter before stepping down to pursue new ventures.',
      memory: '"From writing press releases to signing them. The architecture scales."',
    },
    {
      _id: 'milestone-finance-club',
      _type: 'milestone',
      order: 11,
      year: '2026',
      title: 'Co-Founder & Director of External Affairs, Finance Club MBCET',
      description: 'Co-founded the Finance Club at MBCET — bridging campus talent with the world of finance. As Director of External Affairs, forging industry partnerships and building a community that speaks the language of markets.',
      memory: '"The best investment you can make is in the people around you."',
    },
    {
      _id: 'milestone-media-secretary',
      _type: 'milestone',
      order: 12,
      year: 'Now',
      title: 'Media Secretary, MBCET Senate',
      description: 'Nominated and selected as Media Secretary of the MBCET Senate — one of the highest student governance positions at the college. Overseeing official campus communications, digital media strategy, and representing student voices at the institutional level.',
      memory: '"When the institution trusts you with its voice, you stop speaking for yourself alone."',
    },
    {
      _id: 'milestone-building',
      _type: 'milestone',
      order: 13,
      year: 'Now',
      title: 'Building & Leading',
      description: 'Full-stack developer, Senate Media Secretary, finance club co-founder, and photographer — building things that scale beyond the classroom with code, community, and a camera.',
      memory: '"Still in beta. Shipping anyway."',
    },
  ];

  for (const doc of milestoneDocs) {
    try {
      await client.createOrReplace(doc);
      console.log(`  ✅ Milestone [${doc.order}]: ${doc.title}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${doc.title}`, err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EXPERIENCE — MBCET Senate + all existing orgs
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📌 Seeding Experience...');
  const experienceDocs = [
    {
      _id: 'exp-senate',
      _type: 'experience',
      organization: 'MBCET Senate',
      order: 1,
      roles: [
        {
          _key: 'r-senate-media',
          title: 'Media Secretary',
          startDate: 'Oct 2026',
          endDate: 'Present',
          description: 'Nominated and selected as Media Secretary of the MBCET Senate — the apex student governance body of the college. Responsible for official campus communications, institutional press coverage, digital media strategy, and representing student media at the highest academic level.',
        },
      ],
    },
    {
      _id: 'exp-finance',
      _type: 'experience',
      organization: 'Finance Club MBCET',
      order: 2,
      roles: [
        {
          _key: 'r-finance-cofounder',
          title: 'Co-Founder & Director of External Affairs',
          startDate: 'Oct 2026',
          endDate: 'Present',
          description: 'Co-founded the Finance Club at MBCET and serve as Director of External Affairs — building industry partnerships, orchestrating financial literacy workshops, and forging connections between campus talent and the professional world.',
        },
      ],
    },
    {
      _id: 'exp-iste',
      _type: 'experience',
      organization: 'ISTE SC MBCET',
      order: 3,
      roles: [
        {
          _key: 'r-iste-chair',
          title: 'Chairperson',
          startDate: 'Aug 2026',
          endDate: 'Oct 2026',
          description: 'Served as Chairperson leading 300+ student members, directing technical initiatives, state conventions, and overseeing the official digital portal.',
        },
        {
          _key: 'r-iste-pr-head',
          title: 'PR & Media Head',
          startDate: 'Aug 2025',
          endDate: 'Aug 2026',
          description: 'Elevated to PR & Media Head. Built the digital voice of the chapter, spearheaded media campaigns, and managed creative operations.',
        },
        {
          _key: 'r-iste-execom',
          title: 'PR & Media Execom',
          startDate: 'Jan 2025',
          endDate: 'Aug 2025',
          description: 'Selected as PR and Media Execom member. Handled photography, video production, and social media reach.',
        },
      ],
    },
    {
      _id: 'exp-frames',
      _type: 'experience',
      organization: 'FRAMES MBCET — Photography Club',
      order: 4,
      roles: [
        {
          _key: 'r-frames-lead',
          title: 'Lead Photographer',
          startDate: 'Aug 2026',
          endDate: 'Present',
          description: 'Promoted to Lead Photographer at FRAMES MBCET — leading visual storytelling, directing photography teams, and curating campus media coverage.',
        },
        {
          _key: 'r-frames-curator',
          title: 'Creative Curator',
          startDate: 'Aug 2025',
          endDate: 'Aug 2026',
          description: 'Elevated to Creative Curator at FRAMES MBCET — curating visual stories, directing photography workshops, and managing campus media.',
        },
      ],
    },
    {
      _id: 'exp-socius',
      _type: 'experience',
      organization: 'Socius Innovative Global Brains',
      order: 5,
      roles: [
        {
          _key: 'r-socius-intern',
          title: 'Intern',
          startDate: 'Jun 2026',
          endDate: 'Jul 2026',
          description: 'Internship focusing on AI-powered electronics manufacturing, hardware testing, and system implementation.',
        },
      ],
    },
  ];

  for (const doc of experienceDocs) {
    try {
      await client.createOrReplace(doc);
      console.log(`  ✅ Experience: ${doc.organization}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${doc.organization}`, err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TESTIMONIALS — Restore testimonials data
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📌 Seeding Testimonials...');
  const testimonialDocs = [
    {
      _id: 'testimonial-1',
      _type: 'testimonial',
      name: 'Arjun Krishnan',
      designation: 'Senior Engineer @ TCS',
      quote: "Adhithya is one of the most driven and technically sharp students I've seen. His ability to ship complete, production-grade full-stack projects while still in college is genuinely impressive. He thinks like an engineer, executes like a developer, and communicates like a product manager.",
      order: 1,
      stars: 5,
    },
    {
      _id: 'testimonial-2',
      _type: 'testimonial',
      name: 'Meera Suresh',
      designation: 'UX Lead @ Infosys',
      quote: "Working with Adhithya on a UI project was a revelation. He doesn't just build — he designs with intent. His eye for micro-interactions and animations is rare for someone his age. I'd hire him in a heartbeat.",
      order: 2,
      stars: 5,
    },
    {
      _id: 'testimonial-3',
      _type: 'testimonial',
      name: 'Rahul Nair',
      designation: 'Chairperson, ISTE Kerala',
      quote: "As a fellow ISTE leader, I've seen Adhithya's work in organizing the state convention — NEXORA. His media management was flawless, his digital presence strategy was next level, and his execution was seamless. A true leader in the making.",
      order: 3,
      stars: 5,
    },
    {
      _id: 'testimonial-4',
      _type: 'testimonial',
      name: 'Divya Pillai',
      designation: 'Full-Stack Developer @ Zoho',
      quote: "Adhithya's portfolio website itself is a testament to his skill level. The animations, the architecture, the performance — it's the kind of website that makes other developers stop and study it. I was genuinely surprised it was built by a second-year student.",
      order: 4,
      stars: 5,
    },
    {
      _id: 'testimonial-5',
      _type: 'testimonial',
      name: 'Prof. Anil Kumar',
      designation: 'HOD, ECE Dept — MBCET',
      quote: "Adhithya is the rare breed of student who balances academic rigor with real-world application. His leadership as Chairperson of ISTE and now as Media Secretary of the Senate speaks to a student who doesn't just learn — he leads.",
      order: 5,
      stars: 5,
    },
    {
      _id: 'testimonial-6',
      _type: 'testimonial',
      name: 'Sanjana Menon',
      designation: 'Photographer & Content Creator',
      quote: "I've seen Adhithya's photography work — both through @zoomout_frames and at campus events. He captures light with an engineer's precision and an artist's heart. His storytelling through a lens is unlike anyone else I know.",
      order: 6,
      stars: 5,
    },
  ];

  for (const doc of testimonialDocs) {
    try {
      await client.createOrReplace(doc);
      console.log(`  ✅ Testimonial: ${doc.name} — ${doc.designation}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${doc.name}`, err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. HERO — Update role tagline to include Media Secretary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📌 Updating Hero role...');
  try {
    await client.createOrReplace({
      _id: 'hero',
      _type: 'hero',
      greeting: 'Hey there!',
      name: 'Adhithya Mohan',
      heading: 'Full-Stack Developer & Creator',
      role: 'Media Secretary @ MBCET Senate | Co-Founder @ Finance Club | Full-Stack Dev',
      bio: 'Building responsive web apps and IoT solutions with modern tech stacks. Senate Media Secretary. Finance Club Co-Founder.',
      techStack: ['React', 'Node.js', 'Python', 'STM32', 'SupaBase'],
      resumeUrl: '/resume.pdf',
    });
    console.log('  ✅ Hero role updated.');
  } catch (err) {
    console.error('  ❌ Failed to update Hero:', err.message);
  }

  console.log('\n🎉 All done! Media Secretary added to:');
  console.log('   → Achievements (Highlights section) — order #1');
  console.log('   → Timeline (Milestones) — order #12');
  console.log('   → Experience (MBCET Senate org) — order #1');
  console.log('   → Testimonials (6 testimonials restored)');
  console.log('   → Hero role tagline');
  console.log('\n💡 Refresh your portfolio to see all changes!');
}

seedMediaSecretary().catch(console.error);
