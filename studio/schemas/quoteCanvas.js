export default {
  name: 'quoteCanvas',
  title: 'Quote Canvas',
  type: 'document',
  fields: [
    {
      name: 'quoteText',
      title: 'Quote Text',
      type: 'text',
      description: 'The elegant handwritten quote to display.',
      validation: (Rule) => Rule.required(),
      initialValue: 'Today builds tomorrow',
    },
    {
      name: 'author',
      title: 'Author / Attribution (Optional)',
      type: 'string',
      description: 'Optional attribution for the quote (e.g., "- Adhithya").',
    },
    {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Enable or disable this quote on the website.',
      initialValue: true,
    },
  ],
};
