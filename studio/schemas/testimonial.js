export default {
  name: 'testimonial',
  title: 'Testimonials (Quotes)',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'role', title: 'Role', type: 'string' },
    { name: 'quote', title: 'Quote', type: 'text' },
    { name: 'image', title: 'User Image', type: 'image', options: { hotspot: true } },
    { name: 'order', title: 'Display Order', type: 'number' }
  ]
}
