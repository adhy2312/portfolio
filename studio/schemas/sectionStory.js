export default {
  name: 'sectionStory',
  title: 'Section Story',
  type: 'document',
  fields: [
    {
      name: 'sectionId',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          { title: 'About', value: 'about' },
          { title: 'Skills', value: 'skills' },
          { title: 'Experience', value: 'experience' },
          { title: 'Projects', value: 'projects' },
          { title: 'Photography', value: 'photography' },
          { title: 'Achievements', value: 'achievements' },
          { title: 'Testimonials', value: 'testimonials' },
          { title: 'Contact', value: 'contact' },
          { title: 'Trusted By', value: 'trustedBy' }
        ],
        layout: 'dropdown'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'title',
      title: 'Modal Title',
      type: 'string',
      description: 'E.g. "Behind the Scenes", "How I Built This"',
      validation: Rule => Rule.required()
    },
    {
      name: 'story',
      title: 'Story Content',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Tell the story behind this section.',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sectionId'
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: `Section: ${subtitle}`
      }
    }
  }
}
