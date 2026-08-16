const https = require('https');
require('dotenv').config();

const projectId = process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya';
const dataset = process.env.REACT_APP_SANITY_DATASET || 'production';
const token = process.env.REACT_APP_SANITY_TOKEN;

console.log("ProjectId:", projectId, "Dataset:", dataset, "Token length:", token ? token.length : 0);

function sanityQuery(groq) {
  return new Promise((resolve, reject) => {
    const url = `https://${projectId}.api.sanity.io/v2023-05-03/data/query/${dataset}?query=${encodeURIComponent(groq)}`;
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function sanityMutate(mutations) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ mutations });
    const options = {
      hostname: `${projectId}.api.sanity.io`,
      port: 443,
      path: `/v2023-05-03/data/mutate/${dataset}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log("Fetching milestones...");
  const mRes = await sanityQuery('*[_type == "milestone"] | order(order asc)');
  console.log("Current milestones count:", mRes.result ? mRes.result.length : 0);
  if (mRes.result) {
    mRes.result.forEach(m => console.log(`- [${m.order}] ${m.year}: ${m.title}`));
  }

  console.log("\nFetching experiences...");
  const eRes = await sanityQuery('*[_type == "experience"]');
  console.log("Current experiences count:", eRes.result ? eRes.result.length : 0);
  if (eRes.result) {
    eRes.result.forEach(e => console.log(`- Org: ${e.organization}, roles: ${e.roles ? e.roles.length : 0}`));
  }

  // --- MUTATION LOGIC ---
  const mutations = [];

  // 1. Add / Update Chairperson milestone in Sanity without losing existing ones
  const existingMilestones = mRes.result || [];
  const maxOrder = existingMilestones.reduce((max, item) => Math.max(max, item.order || 0), 0);
  
  const existingChairpersonM = existingMilestones.find(m => m.title && m.title.toLowerCase().includes('chairperson'));
  
  if (!existingChairpersonM) {
    console.log(`\nAdding Chairperson Milestone with order ${maxOrder + 10}...`);
    mutations.push({
      create: {
        _type: 'milestone',
        year: '2026',
        title: 'Elected Chairperson, ISTE SC MBCET',
        description: 'Elected Chairperson of the ISTE Student Chapter at MBCET. Leading 300+ members, driving technical events, and shaping the future of the chapter.',
        memory: '"From writing press releases to signing them. The architecture scales."',
        order: maxOrder + 10
      }
    });
  } else {
    console.log("\nUpdating existing Chairperson milestone in Sanity...");
    mutations.push({
      patch: {
        id: existingChairpersonM._id,
        set: {
          year: '2026',
          title: 'Elected Chairperson, ISTE SC MBCET',
          description: 'Elected Chairperson of the ISTE Student Chapter at MBCET. Leading 300+ members, driving technical events, and shaping the future of the chapter.',
          memory: '"From writing press releases to signing them. The architecture scales."'
        }
      }
    });
  }

  // 2. Update Experience document for ISTE in Sanity
  if (eRes.result && eRes.result.length > 0) {
    const isteExp = eRes.result.find(e => e.organization && e.organization.toLowerCase().includes('iste'));
    if (isteExp) {
      console.log(`Updating roles inside ISTE experience document (${isteExp._id})...`);
      const updatedRoles = [
        {
          _key: 'role_chairperson',
          title: 'Chairperson',
          startDate: 'Aug 2026',
          endDate: 'Present',
          description: 'Leading the ISTE Student Chapter at MBCET — directing 300+ members, spearheading technical state conventions, and overseeing chapter operations.'
        },
        {
          _key: 'role_pr_head',
          title: 'PR & Media Head',
          startDate: 'Aug 2025',
          endDate: 'Aug 2026',
          description: 'Elevated to PR and Media Head at ISTE SC MBCET. Built the digital voice of the chapter and spearheaded media campaigns.'
        },
        {
          _key: 'role_pr_execom',
          title: 'PR & Media Junior Execom',
          startDate: 'Jan 2025',
          endDate: 'Aug 2025',
          description: 'Selected as PR and Media Execom member. Handled media production and digital storytelling.'
        }
      ];
      mutations.push({
        patch: {
          id: isteExp._id,
          set: {
            roles: updatedRoles
          }
        }
      });
    } else {
      console.log("Creating ISTE Experience document in Sanity...");
      mutations.push({
        create: {
          _type: 'experience',
          organization: 'ISTE SC MBCET',
          order: 1,
          roles: [
            {
              _key: 'role_chairperson',
              title: 'Chairperson',
              startDate: 'Aug 2026',
              endDate: 'Present',
              description: 'Leading the ISTE Student Chapter at MBCET — directing 300+ members, spearheading technical state conventions, and overseeing chapter operations.'
            },
            {
              _key: 'role_pr_head',
              title: 'PR & Media Head',
              startDate: 'Aug 2025',
              endDate: 'Aug 2026',
              description: 'Elevated to PR and Media Head at ISTE SC MBCET. Built the digital voice of the chapter and spearheaded media campaigns.'
            }
          ]
        }
      });
    }
  }

  // Execute mutations if any
  if (mutations.length > 0) {
    console.log(`\nSending ${mutations.length} mutation(s) to Sanity CMS...`);
    const mutateRes = await sanityMutate(mutations);
    console.log("Mutation response:", JSON.stringify(mutateRes, null, 2));
  } else {
    console.log("No mutations needed.");
  }
}

run().catch(console.error);
