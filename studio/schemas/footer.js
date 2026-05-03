export default {
  name: 'footer',
  title: 'Footer Settings',
  type: 'document',
  fields: [
    { name: 'tagline', title: 'Tagline', type: 'text' },
    { name: 'email', title: 'Email Address', type: 'string' },
    { name: 'whatsapp', title: 'WhatsApp Number', type: 'string' },
    { name: 'location', title: 'Location', type: 'string' },
    { 
      name: 'socialLinks', 
      title: 'Social Links', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'platform', type: 'string' },
            { name: 'url', type: 'url' },
            { name: 'iconName', type: 'string' }
          ]
        }
      ] 
    }
  ]
}
