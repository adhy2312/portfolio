import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { FiCamera } from 'react-icons/fi';
import './CameraViewfinder.css';

const CameraViewfinder = () => {
  const [scrollData, setScrollData] = useState({
    iso: 100,
    shutter: '1/60',
    aperture: 'F1.8',
    ev: 0,
    batteryBlink: false
  });
  
  const [isFlashing, setIsFlashing] = useState(false);
  const flashAudioRef = useRef(null);

  useEffect(() => {
    // Create a simple shutter click audio
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'); // We can just use an empty audio or rely on a visual flash if audio data is too long.
    // Instead of base64 audio which might be buggy, we'll just rely on the visual flash, which is very impactful on its own.
  }, []);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min(1, Math.max(0, scrollTop / docHeight));

    // Dynamic Metadata
    // ISO goes from 100 to 6400
    const isoValues = [100, 200, 400, 800, 1600, 3200, 6400];
    const isoIndex = Math.floor(scrollPercent * (isoValues.length - 1));
    const iso = isoValues[isoIndex] || 6400;

    // Shutter speed goes from 1/60 to 1/8000
    const shutterValues = ['1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000', '1/8000'];
    const shutterIndex = Math.floor(scrollPercent * (shutterValues.length - 1));
    const shutter = shutterValues[shutterIndex] || '1/8000';

    // EV meter -3 to +3
    const ev = (scrollPercent * 6 - 3).toFixed(1);

    setScrollData({
      iso,
      shutter,
      aperture: 'F1.8', // Fixed fast lens
      ev,
      batteryBlink: scrollPercent > 0.9 // Blinks at the very bottom
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Init
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const takeSnapshot = async () => {
    setIsFlashing(true);
    
    try {
      // Hide the viewfinder UI temporarily so it doesn't block the actual site content in the screenshot,
      // or we can keep it to make the screenshot look like a viewfinder! Let's keep it!
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: 2, // High resolution
        ignoreElements: (element) => {
          // Ignore the flash overlay itself
          if (element.classList.contains('viewfinder-flash')) return true;
          // Ignore external things like Intercom/Spotify if they break CORS
          return false;
        }
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `portfolio-snapshot-${new Date().getTime()}.png`;
      link.click();
    } catch (e) {
      console.error("Snapshot failed:", e);
    }
    
    setTimeout(() => setIsFlashing(false), 500);
  };

  return (
    <div className="camera-viewfinder-overlay">
      {/* Visual Flash Overlay */}
      <div className={`viewfinder-flash ${isFlashing ? 'active' : ''}`} />

      {/* Grid Lines */}
      <div className="vf-grid-hz vf-grid-hz-1" />
      <div className="vf-grid-hz vf-grid-hz-2" />
      <div className="vf-grid-vt vf-grid-vt-1" />
      <div className="vf-grid-vt vf-grid-vt-2" />

      {/* Center AF Brackets */}
      <div className="vf-af-bracket">
        <div className="vf-af-tl" />
        <div className="vf-af-tr" />
        <div className="vf-af-bl" />
        <div className="vf-af-br" />
        <div className="vf-af-center" />
      </div>

      {/* Top HUD */}
      <div className="vf-hud-top">
        <div className="vf-hud-left">
          <div className="vf-rec">
            <span className="vf-rec-dot blink"></span> REC
          </div>
          <div className="vf-format">RAW+JPEG</div>
        </div>
        <div className="vf-hud-right">
          <div className={`vf-battery ${scrollData.batteryBlink ? 'blink-fast' : ''}`}>
            [███░]
          </div>
          <div className="vf-sd">[ 9999 ]</div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="vf-hud-bottom">
        <div className="vf-hud-stats">
          <span>M</span>
          <span>{scrollData.shutter}</span>
          <span>{scrollData.aperture}</span>
          <span>ISO {scrollData.iso}</span>
          <span>AWB</span>
          <span>AF-C</span>
        </div>
      </div>

      {/* Exposure Meter (Right Side) */}
      <div className="vf-ev-meter">
        <div className="vf-ev-scale">
          <span>+3</span>
          <span>-</span>
          <span>+2</span>
          <span>-</span>
          <span>+1</span>
          <span>-</span>
          <span> 0</span>
          <span>-</span>
          <span>-1</span>
          <span>-</span>
          <span>-2</span>
          <span>-</span>
          <span>-3</span>
        </div>
        {/* The pointer moves along the scale based on EV (-3 to +3) */}
        <div 
          className="vf-ev-pointer" 
          style={{ transform: `translateY(${(-scrollData.ev + 3) * (100 / 6)}%)` }}
        >
          ▶
        </div>
      </div>

      {/* Shutter Button (pointer-events auto so it's clickable) */}
      <button className="vf-shutter-btn" onClick={takeSnapshot} aria-label="Take Snapshot">
        <FiCamera />
      </button>
    </div>
  );
};

export default CameraViewfinder;
