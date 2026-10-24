import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const SANITY_PROJECT_ID = process.env.REACT_APP_SANITY_PROJECT_ID || 'uefti8ya';
const SANITY_DATASET = process.env.REACT_APP_SANITY_DATASET || 'production';

// Client-side browser queries are read-only and unauthenticated.
// Secret write tokens are NEVER bundled into client code.
export const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2023-05-03',
  useCdn: true,
});

const builder = imageUrlBuilder(client);

// Safe chainable stub to prevent app crashes when an image asset is null or missing in Sanity
const emptyBuilder = {
  width: () => emptyBuilder,
  height: () => emptyBuilder,
  fit: () => emptyBuilder,
  crop: () => emptyBuilder,
  quality: () => emptyBuilder,
  auto: () => emptyBuilder,
  url: () => '',
};

export const urlFor = (source) => {
  if (!source || (!source.asset && !source._ref)) {
    return emptyBuilder;
  }
  try {
    return builder.image(source).auto('format').fit('max');
  } catch (err) {
    return emptyBuilder;
  }
};

