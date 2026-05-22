export default {
  name: 'testimonial',
  title: 'Testimonials (Quotes)',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      description: 'Full name of the person giving the testimonial',
      validation: Rule => Rule.required()
    },
    {
      name: 'designation',
      title: 'Designation / Role',
      type: 'string',
      description: 'Job title and company — e.g. "Senior Engineer @ Google"',
      validation: Rule => Rule.required()
    },
    {
      name: 'quote',
      title: 'Testimonial Quote',
      type: 'text',
      rows: 4,
      description: 'What they said about you',
      validation: Rule => Rule.required()
    },
    {
      name: 'image',
      title: 'Profile Photo',
      type: 'image',
      description: 'Round profile photo of the person (optional — initials are shown if absent)',
      options: { hotspot: true }
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in the marquee'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'designation',
      media: 'image'
    }
  }
}
