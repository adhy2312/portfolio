export default {
  name: 'experience',
  title: 'Experience',
  type: 'document',
  fields: [
    { name: 'organization', title: 'Organization', type: 'string' },
    { name: 'logo', title: 'Organization Logo', type: 'image', options: { hotspot: true } },
    { name: 'order', title: 'Display Order', type: 'number' },
    {
      name: 'roles',
      title: 'Roles / Positions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Role Title', type: 'string' },
            { name: 'startDate', title: 'Start Date', type: 'string' },
            { name: 'endDate', title: 'End Date', type: 'string', description: 'Leave empty or "Present" if current' },
            { name: 'description', title: 'Description', type: 'text' }
          ]
        }
      ]
    }
  ]
}
