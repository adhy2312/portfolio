export default {
  name: 'hero',
  title: 'Hero Section',
  type: 'document',
  fields: [
    { name: 'greeting', title: 'Greeting', type: 'string' },
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'role', title: 'Role Title', type: 'string' },
    { name: 'bio', title: 'Bio Description', type: 'text' },
    { name: 'techStack', title: 'Tech Stack', type: 'array', of: [{ type: 'string' }] },
    { name: 'resumeUrl', title: 'Resume PDF URL', type: 'url' },
    { name: 'heroImage', title: 'Hero Image (Cutout)', type: 'image', options: { hotspot: true } }
  ]
}
