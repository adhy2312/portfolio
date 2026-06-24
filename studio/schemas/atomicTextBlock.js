export default {
  name: 'atomicTextBlock',
  title: 'Atomic Text Block',
  type: 'object',
  fields: [
    {
      name: 'eyebrow',
      title: 'Label / Eyebrow',
      type: 'string',
      description: 'The small label text above the heading',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'array',
      of: [{ type: 'atomicBlockContent' }], 
    },
    {
      name: 'body',
      title: 'Body Text',
      type: 'array',
      of: [{ type: 'atomicBlockContent' }],
    }
  ]
}
