export default {
  name: 'trustedBy',
  title: 'Trusted By (Brands)',
  type: 'document',
  fields: [
    { name: 'name', title: 'Brand Name', type: 'string' },
    { name: 'logo', title: 'Brand Logo', type: 'image', options: { hotspot: true } },
    { name: 'order', title: 'Display Order', type: 'number' }
  ]
}
