export default {
  name: 'visualSettings',
  title: 'Visual & Styling Settings',
  type: 'document',
  fields: [
    {
      name: 'fontHeading',
      title: 'Heading Font Family',
      type: 'string',
      description: 'e.g. Space Grotesk, Syne, Outfit, Inter',
    },
    {
      name: 'fontBody',
      title: 'Body Font Family',
      type: 'string',
      description: 'e.g. DM Sans, Inter, Plus Jakarta Sans',
    },
    {
      name: 'fontEditorial',
      title: 'Editorial Font Family',
      type: 'string',
      description: 'e.g. Playfair Display, Cormorant Garamond',
    },
    {
      name: 'accentColor',
      title: 'Primary Accent Color',
      type: 'string',
      description: 'Hex color string (e.g. #f4d03f)',
    },
    {
      name: 'bgPrimaryLight',
      title: 'Light Mode Primary Background',
      type: 'string',
    },
    {
      name: 'bgSecondaryLight',
      title: 'Light Mode Secondary Background',
      type: 'string',
    },
    {
      name: 'textPrimaryLight',
      title: 'Light Mode Primary Text Color',
      type: 'string',
    },
    {
      name: 'bgPrimaryDark',
      title: 'Dark Mode Primary Background',
      type: 'string',
    },
    {
      name: 'bgSecondaryDark',
      title: 'Dark Mode Secondary Background',
      type: 'string',
    },
    {
      name: 'textPrimaryDark',
      title: 'Dark Mode Primary Text Color',
      type: 'string',
    },
    {
      name: 'showGrid',
      title: 'Show Background Grid',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'gridSize',
      title: 'Background Grid Size (px)',
      type: 'number',
      description: 'e.g. 40 or 60',
    },
    {
      name: 'gridOpacityLight',
      title: 'Light Mode Grid Opacity',
      type: 'number',
      description: 'A decimal value (e.g. 0.03)',
    },
    {
      name: 'gridOpacityDark',
      title: 'Dark Mode Grid Opacity',
      type: 'number',
      description: 'A decimal value (e.g. 0.012)',
    }
  ]
}
