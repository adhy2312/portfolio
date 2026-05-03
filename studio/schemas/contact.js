export default {
  name: 'contact',
  title: 'Contact Section',
  type: 'document',
  fields: [
    { name: 'heading', title: 'Heading', type: 'string' },
    { name: 'subheading', title: 'Subheading', type: 'text' },
    { 
      name: 'contactMethods', 
      title: 'Contact Methods', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'type', title: 'Type (e.g., Email, Phone)', type: 'string' },
            { name: 'value', title: 'Value (Link/Text)', type: 'string' },
            { name: 'label', title: 'Display Label', type: 'string' },
            { name: 'iconName', title: 'Icon Name', type: 'string', description: 'e.g., FiMail, FiPhone' }
          ]
        }
      ] 
    },
    { name: 'buttonText', title: 'CTA Button Text', type: 'string' },
    { name: 'buttonLink', title: 'Button Link', type: 'url' }
  ]
}
