// src/components/ParticlesBackground.js
import React from 'react';
import { loadBasic } from 'tsparticles-basic';
import Particles from 'react-tsparticles';
import { Engine } from 'tsparticles-engine';

const ParticlesBackground = () => {
  const particlesInit = async (engine) => {
    await loadBasic(engine);
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fullScreen: {
          enable: true,
          zIndex: -1,
        },
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              area: 800,
            },
          },
          color: {
            value: "#00ffff",
          },
          opacity: {
            value: 0.5,
          },
          size: {
            value: 3,
          },
          move: {
            enable: true,
            speed: 1,
          },
        },
      }}
    />
  );
};

export default ParticlesBackground;
