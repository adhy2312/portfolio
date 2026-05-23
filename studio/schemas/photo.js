export default {
  name: 'photo',
  title: 'Photography',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { 
      name: 'image', 
      title: 'Image', 
      type: 'image', 
      options: { 
        hotspot: true,
        metadata: ['blurhash', 'lqip', 'palette'] // Explicitly exclude 'exif' and 'location' to prevent diff-match-patch crashes
      } 
    },
    { name: 'category', title: 'Category', type: 'string' },
    { name: 'order', title: 'Display Order', type: 'number' }
  ]
}
