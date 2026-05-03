export default {
  name: 'hero',
  title: 'Hero Section',
  type: 'document',
  fields: [
    { name: 'greeting', title: 'Greeting', type: 'string' },
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'heading', title: 'Hero Heading', type: 'string', description: 'e.g. Adhithya is Right Here!' },
    { name: 'role', title: 'Role Title', type: 'string' },
    { name: 'bio', title: 'Bio Description', type: 'text' },
    { 
      name: 'stats', 
      title: 'Stats', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'value', type: 'string' },
            { name: 'label', type: 'string' }
          ]
        }
      ] 
    },
    { 
      name: 'highlights', 
      title: 'Highlights (Right Column)', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'text' },
            { name: 'iconName', type: 'string' }
          ]
        }
      ] 
    },
    { name: 'techStack', title: 'Tech Stack', type: 'array', of: [{ type: 'string' }] },
    { name: 'resumeUrl', title: 'Resume PDF URL', type: 'url' },
    { name: 'heroImage', title: 'Hero Image (Cutout)', type: 'image', options: { hotspot: true } }
  ]
}
