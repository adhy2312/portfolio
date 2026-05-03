import React, { useEffect, useState } from 'react';
import './TrustedBy.css';
import { motion } from 'framer-motion';
import { client, urlFor } from '../sanity';

const TrustedBy = () => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const query = '*[_type == "trustedBy"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setBrands(data);
    }).catch(console.error);
  }, []);

  const defaultBrands = [
    { name: "Brand 1", isPlaceholder: true },
    { name: "Brand 2", isPlaceholder: true },
    { name: "Brand 3", isPlaceholder: true },
    { name: "Brand 4", isPlaceholder: true },
  ];

  const displayBrands = brands.length > 0 ? brands : defaultBrands;

  return (
    <div className="trusted-by">
      <div className="container">
        <motion.div
          className="trusted-header"
          initial={{ opacity: 1, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// trusted partners</span>
          <h2 className="section-title">
            Trusted <span>By</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            Collaborating with amazing companies and teams worldwide
          </p>
        </motion.div>
        <p className="trusted-title">Featured Clients & Partners</p>
        <div className="logo-marquee-container">
          <div className="logo-marquee">
            {[...displayBrands, ...displayBrands].map((brand, i) => (
              <div key={i} className="logo-item">
                {brand.isPlaceholder ? (
                   <span className="placeholder-logo">{brand.name}</span>
                ) : (
                  brand.logo ? <img src={urlFor(brand.logo).url()} alt={brand.name} /> : <span className="placeholder-logo">{brand.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
