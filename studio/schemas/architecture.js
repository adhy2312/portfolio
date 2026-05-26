export default {
  name: 'architecture',
  title: 'Architecture & Stack',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Document Title',
      type: 'string',
      initialValue: 'Stack Architecture',
    },
    {
      name: 'stackLayers',
      title: 'Stack Layers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'layer', title: 'Layer Name', type: 'string' },
            { name: 'tech', title: 'Technology', type: 'string' },
            { name: 'icon', title: 'Icon (Feather icon name)', type: 'string' },
            { name: 'color', title: 'Color (Hex)', type: 'string' },
            { name: 'desc', title: 'Description', type: 'text' }
          ],
          preview: {
            select: { title: 'layer', subtitle: 'tech' }
          }
        }
      ]
    },
    {
      name: 'renderStrategies',
      title: 'Render Strategies',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Component Name', type: 'string' },
            { name: 'strategy', title: 'Render Strategy', type: 'string' },
            { name: 'reason', title: 'Rationale', type: 'text' }
          ],
          preview: {
            select: { title: 'name', subtitle: 'strategy' }
          }
        }
      ]
    },
    {
      name: 'consciousnessTiers',
      title: 'Consciousness Tiers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'tier', title: 'Tier Name', type: 'string' },
            { name: 'range', title: 'Point Range', type: 'string' },
            { name: 'color', title: 'Color (Hex)', type: 'string' },
            { name: 'desc', title: 'Description', type: 'text' }
          ],
          preview: {
            select: { title: 'tier', subtitle: 'range' }
          }
        }
      ]
    }
  ]
}
