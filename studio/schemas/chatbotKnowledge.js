export default {
  name: 'chatbotKnowledge',
  title: 'Mini-Adhy AI Knowledge',
  type: 'document',
  icon: () => '🤖',
  fields: [
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Group this fact belongs to (e.g. "Camera Gear", "Projects", "Personality", "Education")',
      options: {
        list: [
          { title: '👤 Personal Info',       value: 'personal' },
          { title: '📷 Photography & Gear',  value: 'photography' },
          { title: '🛠️ Technical Skills',    value: 'skills' },
          { title: '💼 Projects & Work',     value: 'projects' },
          { title: '🎓 Education & Clubs',   value: 'education' },
          { title: '🎭 Personality & Hobbies', value: 'personality' },
          { title: '🔗 Social & Contact',    value: 'social' },
          { title: '👻 Subconscious & Failed Selves', value: 'subconscious' },
          { title: '💡 Other',               value: 'other' },
        ],
        layout: 'dropdown',
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'title',
      title: 'Fact Title',
      type: 'string',
      description: 'Short label (e.g. "Camera Model", "Favourite Language")',
      validation: Rule => Rule.required(),
    },
    {
      name: 'content',
      title: 'Knowledge Content',
      type: 'text',
      rows: 4,
      description: 'The actual information Mini-Adhy will use. Write naturally — this is injected directly into the AI\'s personality.',
      validation: Rule => Rule.required(),
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Uncheck to temporarily disable this fact without deleting it.',
      initialValue: true,
    },
    {
      name: 'order',
      title: 'Priority Order',
      type: 'number',
      description: 'Lower numbers appear first in the AI context. Use to prioritise important facts.',
      initialValue: 50,
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      isActive: 'isActive',
    },
    prepare({ title, subtitle, isActive }) {
      const icons = {
        personal: '👤', photography: '📷', skills: '🛠️',
        projects: '💼', education: '🎓', personality: '🎭',
        social: '🔗', subconscious: '👻', other: '💡',
      };
      return {
        title: `${icons[subtitle] || '💡'} ${title}`,
        subtitle: `${subtitle ? subtitle.toUpperCase() : '—'} ${isActive === false ? '⏸ Disabled' : ''}`,
      };
    },
  },
  orderings: [
    {
      title: 'Priority Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }],
    },
  ],
}
