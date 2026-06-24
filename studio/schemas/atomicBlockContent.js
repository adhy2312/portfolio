export default {
  title: 'Atomic Block Content',
  name: 'atomicBlockContent',
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Quote', value: 'blockquote'}
  ],
  marks: {
    decorators: [
      {title: 'Strong', value: 'strong'},
      {title: 'Emphasis', value: 'em'},
      {title: 'Highlight', value: 'highlight'},
      {title: 'Glitch / Brutal Offset', value: 'glitch'},
      {title: 'Accent Text', value: 'accentText'},
    ],
    annotations: [
      {
        name: 'customOverride',
        type: 'object',
        title: 'Custom Override',
        fields: [
          {
            name: 'cssClass',
            title: 'CSS Class',
            type: 'string',
            description: 'Apply a specific CSS utility class to this phrase'
          }
        ]
      }
    ]
  }
}
