export default {
  name: 'achievement',
  title: 'Achievements / Highlights',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'desc', title: 'Description', type: 'text' },
    { name: 'accent', title: 'Accent Color', type: 'string', description: 'Hex code, e.g., #6C63FF' },
    { name: 'iconName', title: 'Icon Name', type: 'string', description: 'Name of feather icon, e.g., FiAward' },
    { name: 'order', title: 'Display Order', type: 'number' }
  ]
}
