export default {
  name: 'page',
  title: 'Page Builder (Pages)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'e.g., Home Page'
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' }
    },
    {
      name: 'sections',
      title: 'Page Sections',
      description: 'Add, edit, and reorder the sections of this page.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'hero' },
            { type: 'about' },
            { type: 'skillCategory' },
            { type: 'statsBento' },
            { type: 'neuralMap' },
            { type: 'experience' },
            { type: 'contact' },
            { type: 'architecture' },
          ]
        },
        { type: 'object', name: 'techDNASection', title: 'Tech DNA Section', fields: [{ name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'projectListSection', title: 'Project List Section', fields: [{ name: 'heading', type: 'string', initialValue: 'My Works' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'timelineSection', title: 'Timeline Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Timeline' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'photographySection', title: 'Photography Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Photography' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'achievementsSection', title: 'Achievements Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Achievements' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'trustedBySection', title: 'Trusted By Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Trusted By' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'testimonialsSection', title: 'Testimonials Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Testimonials' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'digitalScarsSection', title: 'Digital Scars Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Digital Scars' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'callToActionSection', title: 'Call To Action Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Next Steps' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'stackVisualizerSection', title: 'Stack Visualizer Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Stack' }, { name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'kineticMarqueeSection', title: 'Kinetic Marquee Section', fields: [{ name: 'visualOptions', type: 'visualOptions' }] },
        { type: 'object', name: 'footerSection', title: 'Footer Section', fields: [{ name: 'heading', type: 'string', initialValue: 'Footer' }, { name: 'visualOptions', type: 'visualOptions' }] }
      ]
    }
  ]
}
