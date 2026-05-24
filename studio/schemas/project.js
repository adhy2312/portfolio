export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Full-Stack', value: 'fullstack' },
          { title: 'Frontend', value: 'frontend' },
          { title: 'Electronics / IoT', value: 'electronics' },
          { title: 'Design', value: 'design' },
          { title: 'Photography', value: 'photography' },
        ],
        layout: 'radio',
      },
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'imageUrl',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'githubLink',
      title: 'GitHub Link',
      description: 'Leave empty to hide the GitHub button on the card.',
      type: 'url',
    },
    {
      name: 'liveLink',
      title: 'Live / Demo Link',
      description: 'Leave empty to hide the View Project button on the card.',
      type: 'url',
    },
    {
      name: 'buildTime',
      title: 'Build Timestamp',
      description: 'e.g., "Built at 2:14 AM"',
      type: 'string',
    },
    {
      name: 'soundtrack',
      title: 'Development Soundtrack',
      description: 'e.g., "listening to synthwave"',
      type: 'string',
    },
    {
      name: 'emotionalNote',
      title: 'Emotional Note / Lessons Learned',
      description: 'e.g., "This animation nearly destroyed performance."',
      type: 'text',
    },
  ],
}
