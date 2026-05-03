export default {
  name: 'skillCategory',
  title: 'Skill Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Category Title', type: 'string' },
    { name: 'color', title: 'Category Color', type: 'string', description: 'Hex code, e.g., #6C63FF' },
    { name: 'iconName', title: 'Icon Name', type: 'string', description: 'Name of feather icon, e.g., FiMonitor' },
    { 
      name: 'skills', 
      title: 'Skills', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'level', type: 'number', validation: Rule => Rule.min(0).max(100) }
          ]
        }
      ] 
    }
  ]
}
