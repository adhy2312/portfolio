export default {
  name: 'photo',
  title: 'Photography',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
    { name: 'category', title: 'Category', type: 'string' },
    { name: 'order', title: 'Display Order', type: 'number' }
  ]
}
