export default {
  name: 'neuralMap',
  title: 'Neural Map Nodes',
  type: 'document',
  fields: [
    {
      name: 'nodeKey',
      title: 'Node Key (e.g., frontend)',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'icon',
      title: 'Icon (e.g., FiMonitor)',
      type: 'string',
      description: 'Name of the react-icons/fi component'
    },
    {
      name: 'color',
      title: 'Node Color',
      type: 'string',
      description: 'Hex color code (e.g., #00d2ff)'
    },
    {
      name: 'pos',
      title: '3D Position',
      type: 'array',
      of: [{ type: 'number' }],
      description: 'Array of 3 numbers [X, Y, Z]'
    },
    {
      name: 'projects',
      title: 'Projects',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'thoughts',
      title: 'Thoughts',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'experiments',
      title: 'Experiments',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'failures',
      title: 'Failures',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ]
}
