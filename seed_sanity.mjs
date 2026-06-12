import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'uefti8ya',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-01-01',
  token: 'sksn9zlcxK3SKVWs1a2AXPsuoDEHqasqoT0rkOh4YBQEb7GphUSNnV6LaJasZK47zP3fgoMqThd0PVervfXshtOOpqxfYkhf9CujwDY7wzg8IKq7o3sLWF9WAKyvkpqBELssKNvNEkulCnGschEmJK7OU84rzA3OKQPEMqyt4BpdOOm11jj2'
});

async function seed() {
  console.log('Seeding Stats Bento...');
  const statsBentoDoc = {
    _id: 'statsBento',
    _type: 'statsBento',
    githubUsername: 'adhy2312',
    photosCount: '20,000+',
    photoStyles: 'Portraits • Nature • Landscape',
    photoAwards: '🏆 4x Competition Winner',
    wpmSpeed: 120,
    uiDesigns: '20+',
    travelKm: '50,000',
    coursesCompleted: '10+',
    stacksLearned: '10+',
    primaryAchievement: 'State Level Qualifier — YIP 2025'
  };

  try {
    await client.createOrReplace(statsBentoDoc);
    console.log('✅ Stats Bento seeded.');
  } catch (err) {
    console.error('Error seeding statsBento:', err);
  }

  console.log('Seeding Hardware Nexus...');
  const hardwareNexusDoc = {
    _id: 'hardwareNexus',
    _type: 'hardwareNexus',
    sectionTitle: 'Hardware Nexus',
    sectionSubtitle: 'Embedded Systems & Software Architecture',
    centralText: 'ADHY',
    nodes: [
      {
        _key: 'n1',
        label: 'MCU Processing',
        description: 'Programming ARM Cortex and ESP32 microcontrollers',
        tech: 'C / C++'
      },
      {
        _key: 'n2',
        label: 'Frontend Interface',
        description: 'Building brutalist user interfaces and dashboards',
        tech: 'React / GSAP'
      },
      {
        _key: 'n3',
        label: 'IoT Telemetry',
        description: 'Connecting embedded devices to cloud ecosystems',
        tech: 'MQTT / Node.js'
      },
      {
        _key: 'n4',
        label: 'Data Storage',
        description: 'Architecting relational and real-time databases',
        tech: 'SupaBase / SQL'
      },
      {
        _key: 'n5',
        label: 'Hardware Design',
        description: 'PCB layout and circuit schematic routing',
        tech: 'KiCad / Altium'
      },
      {
        _key: 'n6',
        label: 'AI Integration',
        description: 'Deploying edge ML and large language models',
        tech: 'Python / TensorFlow'
      }
    ]
  };

  try {
    await client.createOrReplace(hardwareNexusDoc);
    console.log('✅ Hardware Nexus seeded.');
  } catch (err) {
    console.error('Error seeding hardwareNexus:', err);
  }
}

seed();
