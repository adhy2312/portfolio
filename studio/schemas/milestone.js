export default {
  name: 'milestone',
  title: 'Milestone (Timeline)',
  type: 'document',
  fields: [
    {
      name: 'order',
      title: 'Order (e.g., 1, 2, 3 for timeline sequence)',
      type: 'number',
      validation: Rule => Rule.required()
    },
    {
      name: 'year',
      title: 'Year or Date (e.g., 2024, Present)',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required()
    }
  ],
  orderings: [
    {
      title: 'Timeline Order',
      name: 'orderAsc',
      by: [
        { field: 'order', direction: 'asc' }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'year'
    }
  }
}
