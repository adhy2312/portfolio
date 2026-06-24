export default {
  name: 'visualOptions',
  title: 'Visual Options',
  type: 'object',
  fields: [
    {
      name: 'paddingTop',
      title: 'Padding Top',
      type: 'string',
      description: 'e.g., "0px", "2rem", "10vh"',
      initialValue: 'auto'
    },
    {
      name: 'paddingBottom',
      title: 'Padding Bottom',
      type: 'string',
      description: 'e.g., "0px", "2rem", "10vh"',
      initialValue: 'auto'
    },
    {
      name: 'backgroundColor',
      title: 'Background Color override',
      type: 'string',
      description: 'Valid CSS color or variable (e.g., "var(--bg-primary)")'
    },
    {
      name: 'contentAlignment',
      title: 'Content Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' }
        ],
        layout: 'radio'
      },
      initialValue: 'left'
    },
    {
      name: 'isHidden',
      title: 'Hide Section',
      type: 'boolean',
      description: 'Temporarily hide this section from the frontend',
      initialValue: false
    }
  ]
}
