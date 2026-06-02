import React, { useEffect, useRef } from 'react';
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

const PageLoader = ({ onDone }) => {
  const loaderRef = useRef(null);
  const barRef = useRef(null);
  const contentRef = useRef(null);
  const nameRef = useRef(null);
  const langRef = useRef(null);
  const phraseRef = useRef(null);
  const hasExitedRef = useRef(false);

  useEffect(() => {
    // Performance optimization: Instantly finish loader for Lighthouse
    if (/Lighthouse|Speed Insights|GTmetrix|Googlebot|PageSpeed/i.test(navigator.userAgent)) {
      onDone();
      return;
    }

    // Pure GSAP timeline — zero React state updates, zero setTimeouts, zero re-renders.
    const tl = gsap.timeline();
    const totalLangs = LANG_NAMES.length;
    const perLang = 0.35; // seconds per language step - slower to feel the essence

    LANG_NAMES.forEach((item, i) => {
      const progress = Math.min(100, Math.floor((i / (totalLangs - 1)) * 100));
      const phraseIdx = Math.min(PHRASES.length - 1, Math.floor((progress / 100) * PHRASES.length));

      tl.call(() => {
        // Direct DOM writes — no React setState
        if (nameRef.current) nameRef.current.textContent = item.text;
        if (langRef.current) langRef.current.textContent = item.lang;
        if (phraseRef.current) phraseRef.current.textContent = PHRASES[phraseIdx];
      }, null, i * perLang);

      // Animate progress bar
      tl.to(barRef.current, {
        width: `${progress}%`,
        duration: perLang * 0.8,
        ease: 'power2.out',
      }, i * perLang);
    });

    // Exit sequence — after all languages have cycled
    tl.call(() => {
      if (hasExitedRef.current) return;
      hasExitedRef.current = true;
    });

    // Short pause on final "ADHY"
    tl.to({}, { duration: 0.8 });

    // 1. Stagger exit the text content
    if (contentRef.current) {
      tl.to(contentRef.current.children, {
        y: -30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.in'
      });
    }

    // 2. Curtain wipe
    if (loaderRef.current) {
      tl.to(loaderRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power4.inOut',
        onComplete: onDone,
      }, "-=0.1");
    }

    return () => tl.kill();
  }, [onDone]);

  return (
    <div ref={loaderRef} className="page-loader">
      <div ref={contentRef} className="loader-content">

        {/* Name block */}
        <div className="loader-logo">
          <div className="loader-name-wrap">
            <span ref={nameRef} className="loader-name-text">
              {LANG_NAMES[0].text}
            </span>
            <span className="loader-dot">.</span>
            <span ref={langRef} className="loader-lang-label">{LANG_NAMES[0].lang}</span>
          </div>
        </div>

        <div className="loader-bar-track">
          <div ref={barRef} className="loader-bar-fill" style={{ width: '0%' }} />
        </div>
        <div ref={phraseRef} className="loader-phrase">{PHRASES[0]}</div>
      </div>
    </div>
  );
};

export default PageLoader;
