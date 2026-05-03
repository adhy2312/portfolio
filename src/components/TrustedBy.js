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
        <p className="trusted-title">Trusted By</p>
        <div className="logo-marquee-container">
          <div className="logo-marquee">
            {[...displayBrands, ...displayBrands].map((brand, i) => (
              <div key={i} className="logo-item">
                {brand.isPlaceholder ? (
                   <span className="placeholder-logo">{brand.name}</span>
                ) : (
                  <img src={urlFor(brand.logo).url()} alt={brand.name} />
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
