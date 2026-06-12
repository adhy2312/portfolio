const hardwareNexus = {
  name: 'hardwareNexus',
  title: 'Hardware Nexus Configuration',
  type: 'document',
  fields: [
    { name: 'sectionTitle', title: 'Section Title', type: 'string' },
    { name: 'sectionSubtitle', title: 'Section Subtitle', type: 'string' },
    { name: 'centralText', title: 'Central Core Text', type: 'string' },
    {
      name: 'nodes',
      title: 'PCB Nodes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Node Label', type: 'string' },
            { name: 'description', title: 'Node Description', type: 'string' },
            { name: 'tech', title: 'Technology/Skill', type: 'string' }
          ]
        }
      ],
      validation: Rule => Rule.max(8)
    }
  ]
};

export default hardwareNexus;
