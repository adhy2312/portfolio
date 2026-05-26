export default {
  name: 'digitalScar',
  title: 'Digital Scar',
  type: 'document',
  fields: [
    {
      name: 'scarId',
      title: 'Scar ID (e.g., ERR-01)',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required(),
    },
    {
      name: 'icon',
      title: 'Icon Name (e.g., FiActivity, FiTerminal, FiAlertCircle)',
      type: 'string',
      description: 'The React Feather Icon name to use.',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Archived', value: 'Archived' },
          { title: 'Fading', value: 'Fading' },
          { title: 'Contained', value: 'Contained' },
          { title: 'Resolved', value: 'Resolved' },
          { title: 'Patched', value: 'Patched' },
          { title: 'Isolated', value: 'Isolated' },
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Order in which this scar appears (lower is first).',
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'scarId',
    }
  }
}
