const { createClient } = require('@sanity/client');
require('dotenv').config();
const c = createClient({
  projectId: 'uefti8ya',
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN
});
const query = `*[_type == "photo"]{
  _id,
  title,
  "img": image.asset->{
    url,
    metadata {
      exif,
      dimensions
    }
  }
}`;
c.fetch(query).then(d => console.log(JSON.stringify(d, null, 2))).catch(console.error);
