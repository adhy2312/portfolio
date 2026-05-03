export default {
  name: 'about',
  title: 'About Section',
  type: 'document',
  fields: [
    { name: 'location', title: 'Location Text', type: 'string' },
    { name: 'bioParagraphs', title: 'Bio Paragraphs', type: 'array', of: [{ type: 'text' }] },
    { 
      name: 'stats', 
      title: 'Stats', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'value', type: 'string' },
            { name: 'label', type: 'string' },
            { name: 'iconName', type: 'string', description: 'Name of feather icon, e.g., FiAward' }
          ]
        }
      ] 
    },
    { name: 'profileImage', title: 'Profile Image', type: 'image' },
    { name: 'experienceYears', title: 'Years of Experience', type: 'string' }
  ]
}
