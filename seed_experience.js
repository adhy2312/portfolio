const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'uefti8ya',
  dataset: 'production',
  token: 'skjyXGH42EaLtRLXUXoIwkwxeauz8ylhhkGrjjmk5fOVibIYEsuTC4iy9VtWbF4ctX7GUfIBmGPPLW9mf0WezTwMe80VVD2Q55Yt3MAfNW5f4Q8OaF0F3kBV9Te7fSy25Xv3kZcL7eLFdTjEDHU8jjgnsf9kX0tMDvzpK2VZum8as7F6tXcl',
  useCdn: false,
  apiVersion: '2023-01-01',
});

async function seedData() {
  const experiences = [
    {
      _type: 'experience',
      organization: 'ISTE SC MBCET',
      order: 1,
      roles: [
        {
          _key: 'r1',
          title: 'PR and Media Head',
          startDate: 'Sep 2025',
          endDate: 'Present',
          description: ''
        },
        {
          _key: 'r2',
          title: 'PR and Media Junior Execom Member',
          startDate: 'Mar 2025',
          endDate: 'Sep 2025',
          description: ''
        }
      ]
    },
    {
      _type: 'experience',
      organization: 'FRAMES MBCET',
      order: 2,
      roles: [
        {
          _key: 'r3',
          title: 'Creative Curator',
          startDate: 'Aug 2025',
          endDate: 'Present',
          description: ''
        },
        {
          _key: 'r4',
          title: 'Active Member',
          startDate: 'Jan 2025',
          endDate: 'Aug 2025',
          description: ''
        }
      ]
    }
  ];

  for (const exp of experiences) {
    try {
      const res = await client.create(exp);
      console.log(`Created experience for ${exp.organization}: ${res._id}`);
    } catch (err) {
      console.error(`Failed to create experience for ${exp.organization}:`, err);
    }
  }
}

seedData();
