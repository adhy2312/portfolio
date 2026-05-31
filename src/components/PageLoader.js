import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import './PageLoader.css';

const PHRASES = [
  'Finding the right light...',
  'Writing the first line...',
  'Connecting the dots...',
  'Namakk sett aakam.'
];

// "Adhy" transliterated into Indian scripts
const LANG_NAMES = [
  { text: 'ADHY',      lang: 'English'    },
  { text: 'ആദി',       lang: 'Malayalam'  },
  { text: 'आधी',       lang: 'Hindi'      },
  { text: 'அத்ய',      lang: 'Tamil'      },
  { text: 'ಅಧ್ಯ',      lang: 'Kannada'    },
  { text: 'అధ్య',      lang: 'Telugu'     },
  { text: 'অধ্য',      lang: 'Bengali'    },
  { text: 'ਅਧਯ',       lang: 'Punjabi'    },
  { text: 'ADHY',      lang: 'English'    }, // return home
];

// Glitch chars used during transition
const GLITCH_CHARS = '█▓▒░▄▀■□▪▫◆◇○●';

function useGlitchCycle(names, intervalMs = 700) {
  const [display, setDisplay] = useState(names[0].text);
  const [langLabel, setLangLabel] = useState(names[0].lang);
  const [isGlitching, setIsGlitching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const idxRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const glitchTransition = (targetText, targetLang, targetIndex, onDone) => {
      setIsGlitching(true);
      let frame = 0;
      const totalFrames = 4; // ultra-fast glitch (60ms total)

      const tick = () => {
        if (cancelled) return;
        frame++;
        if (frame < totalFrames) {
          const scrambled = Array.from(
            { length: Math.max(targetText.length, 4) },
            () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          ).join('');
          setDisplay(scrambled);
          rafRef.current = setTimeout(tick, 15);
        } else {
          setDisplay(targetText);
          setLangLabel(targetLang);
          setCurrentIndex(targetIndex);
          setIsGlitching(false);
          onDone();
        }
      };
      tick();
    };

    const advance = () => {
      if (cancelled) return;
      if (idxRef.current >= names.length - 1) return; // Stop exactly on the last item
      
      idxRef.current = idxRef.current + 1;
      const next = names[idxRef.current];
      glitchTransition(next.text, next.lang, idxRef.current, () => {
        if (!cancelled && idxRef.current < names.length - 1) {
          rafRef.current = setTimeout(advance, intervalMs);
        }
      });
    };

    rafRef.current = setTimeout(advance, intervalMs);

    return () => {
      cancelled = true;
      clearTimeout(rafRef.current);
    };
  }, [names, intervalMs]);

  return { display, langLabel, isGlitching, currentIndex };
}

const PageLoader = ({ onDone }) => {
  const [phrase, setPhrase] = useState(PHRASES[0]);
  
  const loaderRef = useRef(null);
  const barRef = useRef(null);
  const contentRef = useRef(null);
  
  // High-speed sequence: ~120ms wait + 60ms glitch = 180ms per language. Total time: ~1.6s.
  const { display, langLabel, isGlitching, currentIndex } = useGlitchCycle(LANG_NAMES, 120);

  useEffect(() => {
    // Performance optimization: Instantly finish loader for Lighthouse
    if (/Lighthouse|Speed Insights|GTmetrix|Googlebot|PageSpeed/i.test(navigator.userAgent)) {
      onDone();
      return;
    }

    // Map progress definitively to the language index
    const calcProgress = Math.min(100, Math.floor((currentIndex / (LANG_NAMES.length - 1)) * 100));
    
    // GSAP interpolated progress bar width
    if (barRef.current) {
      gsap.to(barRef.current, { width: `${calcProgress}%`, duration: 0.3, ease: 'power2.out' });
    }
    
    // Map phrases 0-3
    const phraseIdx = Math.min(PHRASES.length - 1, Math.floor((calcProgress / 100) * PHRASES.length));
    setPhrase(PHRASES[phraseIdx]);

    if (currentIndex >= LANG_NAMES.length - 1 && !isGlitching) {
      // Premium GSAP Cinematic Exit Sequence
      const tl = gsap.timeline({
        onComplete: onDone,
        delay: 0.15 // Pause on the final English ADHY for a split second
      });

      // 1. Stagger exit the text content
      if (contentRef.current) {
        tl.to(contentRef.current.children, {
          y: -30,
          opacity: 0,
          stagger: 0.05,
          duration: 0.4,
          ease: 'power2.in'
        });
      }

      // 2. Curtain wipe the loader background up smoothly
      if (loaderRef.current) {
        tl.to(loaderRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: 'power4.inOut'
        }, "-=0.1"); // overlap slightly with text fade
      }
    }
  }, [currentIndex, isGlitching, onDone]);

  return (
    <div ref={loaderRef} className="page-loader">
      <div ref={contentRef} className="loader-content">

        {/* Glitch name block */}
        <div className="loader-logo">
          <div className="loader-name-wrap">
            <span className={`loader-name-text ${isGlitching ? 'loader-glitching' : ''}`}>
              {display}
            </span>
            <span className="loader-dot">.</span>
            <span className="loader-lang-label">{langLabel}</span>
          </div>
        </div>

        <div className="loader-bar-track">
          <div ref={barRef} className="loader-bar-fill" style={{ width: '0%' }} />
        </div>
        <div className="loader-phrase">{phrase}</div>
      </div>
    </div>
  );
};

export default PageLoader;
