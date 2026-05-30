export default {
  name: 'toolChip',
  title: 'Tool / Technology Chip',
  type: 'document',
  fields: [
    { 
      name: 'name', 
      title: 'Tool Name', 
      type: 'string', 
      description: 'e.g., React' 
    },
    { 
      name: 'emoji', 
      title: 'Emoji Icon', 
      type: 'string', 
      description: 'e.g., ⚛️' 
    },
    { 
      name: 'snippet', 
      title: 'Snippet (Tooltip Description)', 
      type: 'string', 
      description: 'e.g., UI Library' 
    },
    { 
      name: 'group', 
      title: 'Color Group', 
      type: 'string',
      description: 'Determines the glow and border color of the chip',
      options: {
        list: [
          { title: 'Frontend (Purple Glow)', value: 'frontend' },
          { title: 'Backend (Cyan Glow)', value: 'backend' },
          { title: 'Design (Gold Glow)', value: 'design' },
          { title: 'IoT/Electronics (Green Glow)', value: 'iot' },
          { title: 'Tools (Lilac Glow)', value: 'tools' }
        ]
      }
    }
  ]
}
