import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollCanvasSequence.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollCanvasSequence = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const frameCount = 192;
  const images = useRef([]);
  const canvasContext = useRef(null);

  useEffect(() => {
    // 1. Preload images
    const currentFrame = (index) => `/flow/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;

    let loadedCount = 0;
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) {
          // Draw first frame immediately
          renderFrame(0);
        }
      };
      images.current.push(img);
    }

    // 2. Setup Canvas
    const canvas = canvasRef.current;
    canvasContext.current = canvas.getContext('2d');
    
    // 4. GSAP Scroll Sequence State
    const frameTracker = { frame: 0 };

    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      renderFrame(frameTracker.frame);
    };

    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();

    // 3. Render function (scales image to cover canvas)
    function renderFrame(index) {
      if (!canvasContext.current || !images.current[index]) return;
      const ctx = canvasContext.current;
      const img = images.current[index];
      
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      
      // Use Math.min to 'contain' the image instead of 'cover' (Math.max).
      // This prevents the image from being massively zoomed in and cut off.
      const ratio  = Math.min(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;  

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Optional: Add a slight sharpening/contrast boost to the canvas filter
      ctx.filter = 'contrast(1.15) brightness(1.05) saturate(1.1)';
      ctx.drawImage(img, 0, 0, img.width, img.height,
         centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);  
      ctx.filter = 'none';

      // Manage Text Narrative Opacities
      const act1 = document.querySelector('.seq-act-1');
      const act2 = document.querySelector('.seq-act-2');
      const act3 = document.querySelector('.seq-act-3');
      
      if (act1 && act2 && act3) {
        act1.style.opacity = index < 65 ? 1 : 0;
        act2.style.opacity = index >= 65 && index < 130 ? 1 : 0;
        act3.style.opacity = index >= 130 ? 1 : 0;
      }
    }

    // 4. GSAP Scroll Sequence Animation
    
    let ctx = gsap.context(() => {
      // Pin the container and scrub through frames
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: '+=400%', // 400% scroll distance to give buttery smooth scrubbing
        pin: true,
        scrub: 0.5, // Small scrub delay for smooth interpolation
        animation: gsap.to(frameTracker, {
          frame: frameCount - 1,
          snap: 'frame',
          ease: 'none',
          onUpdate: () => renderFrame(Math.round(frameTracker.frame))
        })
      });

    }, containerRef);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      ctx.revert();
    };
  }, []);

  return (
    <section className="scroll-canvas-sequence" ref={containerRef}>
      <canvas ref={canvasRef} className="sequence-canvas"></canvas>
      <div className="sequence-crt-overlay"></div>

      <div className="sequence-ui-layer">
        <div className="seq-act seq-act-1">
          <div className="seq-meta">01 // THE SENSOR MATRIX — Canon 6D</div>
          <div className="seq-subtitle">An engineering baseline capturing raw ambient data at 18 megapixels.</div>
        </div>

        <div className="seq-act seq-act-2">
          <div className="seq-meta">02 // FULL FRAME SENSOR</div>
          <div className="seq-subtitle">Extracting each and every bit of light entering onto the sensor to maintain sharpness and bokeh.</div>
        </div>

        <div className="seq-act seq-act-3">
          <div className="seq-meta">03 // COMPOSITION GEOMETRY — f/1.8 50mm STM Lens</div>
          <div className="seq-subtitle">Decent narrative rendering at f/1.8. Gathering expansive low-light environments with absolute sharpness across the focal plane.</div>
        </div>
      </div>
    </section>
  );
};

export default ScrollCanvasSequence;
