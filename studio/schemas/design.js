const designSchema = {
  name: 'design',
  title: 'Designs & UI/UX',
  type: 'document',
  fields: [
    { 
      name: 'title', 
      title: 'Design / Project Title', 
      type: 'string',
      validation: Rule => Rule.required()
    },
    { 
      name: 'subtitle', 
      title: 'Short Subtitle / Deliverable', 
      type: 'string',
      description: 'e.g. "Fintech Mobile Banking App" or "Dark Minimalist Branding"'
    },
    { 
      name: 'image', 
      title: 'Main Artboard / Hero Preview', 
      type: 'image', 
      options: { 
        hotspot: true,
        metadata: ['blurhash', 'lqip', 'palette']
      },
      validation: Rule => Rule.required()
    },
    { 
      name: 'category', 
      title: 'Design Discipline', 
      type: 'string',
      options: {
        list: [
          { title: 'UI/UX & Mobile Apps', value: 'Mobile UI/UX' },
          { title: 'Web Design & Interactive Systems', value: 'Web Design' },
          { title: 'Brand Identity & Design Systems', value: 'Brand Identity' },
          { title: 'Poster & Typography Design', value: 'Poster Design' },
          { title: '3D & Motion Graphics', value: '3D & Motion' }
        ],
      },
      initialValue: 'Mobile UI/UX'
    },
    {
      name: 'tool',
      title: 'Primary Software / Tool',
      type: 'string',
      options: {
        list: [
          { title: 'Figma', value: 'Figma' },
          { title: 'Adobe Illustrator', value: 'Adobe Illustrator' },
          { title: 'Adobe Photoshop', value: 'Adobe Photoshop' },
          { title: 'Principle / Protopie', value: 'Principle' },
          { title: 'Spline 3D', value: 'Spline' },
          { title: 'Blender', value: 'Blender' }
        ]
      },
      initialValue: 'Figma'
    },
    {
      name: 'artboard',
      title: 'Artboard Dimensions',
      type: 'string',
      description: 'e.g. "1920 × 1080px" or "390 × 844px (iOS Retina)"',
      initialValue: '1920 × 1080px'
    },
    {
      name: 'typography',
      title: 'Typography System',
      type: 'string',
      description: 'e.g. "Inter / Outfit Display" or "Clash Display + Satoshi"',
      initialValue: 'Inter & Plus Jakarta Sans'
    },
    {
      name: 'colors',
      title: 'Extracted Palette (Hex Codes)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Hex codes for the design palette, e.g. #0F172A, #6366F1, #38BDF8'
    },
    {
      name: 'figmaLink',
      title: 'Live Figma / Prototype Link',
      type: 'url',
      description: 'Direct link to Figma file, prototype, or Behance case study'
    },
    {
      name: 'caseStudy',
      title: 'Design Brief & Case Study Notes',
      type: 'text',
      rows: 3,
      description: 'Key design rationale, user problem solved, or visual concept'
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

export default designSchema;
