const photoSchema = {
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
    { 
      name: 'category', 
      title: 'Category', 
      type: 'string',
      options: {
        list: [
          { title: 'Photography', value: 'Design' },
          { title: 'Design', value: 'Photography' }
        ],
        layout: 'radio'
      },
      initialValue: 'Photography'
    },
    { name: 'order', title: 'Display Order', type: 'number' }
  ]
};

export default photoSchema;
