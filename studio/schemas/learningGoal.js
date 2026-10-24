export default {
  name: 'learningGoal',
  title: 'Learning Goal (Horizon & Radar)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Topic / Technology',
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'e.g., Linux, Mobile App Dev, Cybersecurity'
    },
    {
      name: 'domain',
      title: 'Domain / Focus Area',
      type: 'string',
      description: 'e.g., Kernel & Architecture, Cross-Platform, AppSec'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Planned (Horizon)', value: 'planned' },
          { title: 'In Progress (Active Study)', value: 'in_progress' },
          { title: 'Exploration', value: 'exploring' }
        ]
      },
      initialValue: 'planned'
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 1
    },
    {
      name: 'tags',
      title: 'Key Sub-topics',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ]
};
