import React from 'react';

const photos = [
  'https://source.unsplash.com/random/800x600?nature',
  'https://source.unsplash.com/random/800x600?city',
  'https://source.unsplash.com/random/800x600?portrait',
];

function Gallery() {
  return (
    <section className="section">
      <h2>✨ Featured Shots</h2>
      <div style={{
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {photos.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`photo-${index}`}
            style={{
              width: '300px',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
              transition: 'transform 0.3s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>
    </section>
  );
}

export default Gallery;
