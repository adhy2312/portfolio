const photoSchema = {
  name: 'photo',
  title: 'Photography',
  type: 'document',
  fields: [
    { 
      name: 'title', 
      title: 'Title / Subject', 
      type: 'string',
      validation: Rule => Rule.required()
    },
    { 
      name: 'image', 
      title: 'Photograph', 
      type: 'image', 
      options: { 
        hotspot: true,
        metadata: ['blurhash', 'lqip', 'palette']
      },
      validation: Rule => Rule.required()
    },
    { 
      name: 'category', 
      title: 'Genre / Style', 
      type: 'string',
      options: {
        list: [
          { title: 'Portraits & People', value: 'Portraits' },
          { title: 'Automotive & Street', value: 'Automotive' },
          { title: 'Nature & Wildlife', value: 'Nature' },
          { title: 'Campus & Institutional Events', value: 'Events' },
          { title: 'Monochrome & Cinematic', value: 'Cinematic' },
          { title: 'Other Visual Experiment', value: 'Photography' }
        ],
      },
      initialValue: 'Portraits'
    },
    {
      name: 'camera',
      title: 'Camera Body',
      type: 'string',
      description: 'e.g. "Canon EOS R" or "Leica M11"'
    },
    {
      name: 'lens',
      title: 'Optics / Lens Model',
      type: 'string',
      description: 'e.g. "85mm f/1.4L" or "50mm f/1.8 STM"'
    },
    {
      name: 'shutter',
      title: 'Shutter Speed',
      type: 'string',
      description: 'e.g. "1/500s"'
    },
    {
      name: 'aperture',
      title: 'Aperture',
      type: 'string',
      description: 'e.g. "f/1.8"'
    },
    {
      name: 'iso',
      title: 'ISO Value',
      type: 'string',
      description: 'e.g. "ISO 200"'
    },
    { 
      name: 'order', 
      title: 'Display Order', 
      type: 'number' 
    },
    { 
      name: 'visualOptions', 
      title: 'Visual & Layout Options', 
      type: 'visualOptions' 
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'image'
    }
  }
};

export default photoSchema;
