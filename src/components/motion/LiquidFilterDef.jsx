import React from 'react';

/**
 * Global SVG filter definition for the Liquid Typography effect.
 * Renders an invisible SVG containing the displacement map.
 */
export default function LiquidFilterDef() {
  return (
    <svg 
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="liquid-filter" x="-20%" y="-20%" width="140%" height="140%">
          {/* 
            feTurbulence generates the noise. 
            baseFrequency will be animated by GSAP to create the melting effect. 
          */}
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.00" 
            numOctaves="3" 
            result="noise" 
            id="liquid-turbulence"
          />
          {/* 
            feDisplacementMap applies the noise to the SourceGraphic (the text).
            scale determines how far the pixels get displaced.
          */}
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale="0" 
            xChannelSelector="R" 
            yChannelSelector="G" 
            id="liquid-displacement"
          />
        </filter>
      </defs>
    </svg>
  );
}
