export default {
  name: 'skillCategory',
  title: 'Skill Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Category Title', type: 'string' },
    { name: 'color', title: 'Category Color', type: 'string', description: 'Hex code, e.g., #6C63FF' },
    { name: 'iconName', title: 'Icon Name', type: 'string', description: 'Name of feather icon, e.g., FiMonitor' },
    { name: 'order', title: 'Display Order', type: 'number', initialValue: 99 },
    { 
      name: 'skills', 
      title: 'Skills', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Skill Name', type: 'string' },
            { name: 'level', title: 'Proficiency (0–100)', type: 'number', validation: Rule => Rule.min(0).max(100) }
          ]
        }
      ] 
    },
    { name: 'visualOptions', title: 'Visual & Layout Options', type: 'visualOptions' }
  ]
}
