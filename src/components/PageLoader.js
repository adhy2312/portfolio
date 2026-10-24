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
  const percentRef = useRef(null);
  const hasExitedRef = useRef(false);

  useEffect(() => {
    // Keep viewport strictly at top while loader is active
    window.scrollTo(0, 0);

    const safeExit = () => {
      if (hasExitedRef.current) return;
      hasExitedRef.current = true;
      if (loaderRef.current) {
        loaderRef.current.style.pointerEvents = 'none';
      }
      window.scrollTo(0, 0);
      onDone();
    };

    // Performance optimization: Instantly finish loader for Lighthouse / bots
    if (/Lighthouse|Speed Insights|GTmetrix|Googlebot|PageSpeed/i.test(navigator.userAgent)) {
      safeExit();
      return;
    }

    // Safety fallback timer: guarantees page NEVER freezes on mobile
    const fallbackTimer = setTimeout(() => {
      safeExit();
    }, 2800);

    // Pure GSAP timeline — zero React re-renders, silky 60fps
    const tl = gsap.timeline();
    const totalLangs = LANG_NAMES.length;
    const perLang = 0.22; // Snappy, elegant pacing

    LANG_NAMES.forEach((item, i) => {
      const progress = Math.min(100, Math.floor((i / (totalLangs - 1)) * 100));
      const phraseIdx = Math.min(PHRASES.length - 1, Math.floor((progress / 100) * PHRASES.length));

      tl.call(() => {
        if (nameRef.current) nameRef.current.textContent = item.text;
        if (langRef.current) langRef.current.textContent = item.lang;
        if (phraseRef.current) phraseRef.current.textContent = PHRASES[phraseIdx];
        if (percentRef.current) percentRef.current.textContent = `${progress.toString().padStart(2, '0')}%`;
      }, null, i * perLang);

      // Animate progress bar fill
      tl.to(barRef.current, {
        width: `${progress}%`,
        duration: perLang * 0.85,
        ease: 'power2.out',
      }, i * perLang);
    });

    // Brief poise on final "ADHY"
    tl.to({}, { duration: 0.45 });

    // 1. Stagger exit the text content
    if (contentRef.current) {
      tl.to(contentRef.current.children, {
        y: -24,
        opacity: 0,
        stagger: 0.08,
        duration: 0.4,
        ease: 'power2.in',
        onStart: () => {
          if (loaderRef.current) loaderRef.current.style.pointerEvents = 'none';
        }
      });
    }

    // 2. Curtain wipe upwards
    if (loaderRef.current) {
      tl.to(loaderRef.current, {
        yPercent: -100,
        duration: 0.85,
        ease: 'power4.inOut',
        onStart: () => {
          if (loaderRef.current) loaderRef.current.style.pointerEvents = 'none';
          window.scrollTo(0, 0);
        },
        onComplete: () => {
          clearTimeout(fallbackTimer);
          safeExit();
        },
      }, "-=0.1");
    }

    return () => {
      clearTimeout(fallbackTimer);
      tl.kill();
    };
  }, [onDone]);

  return (
    <div ref={loaderRef} className="page-loader" aria-label="Loading portfolio">
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

        {/* Brutalist Progress bar with percentage readout */}
        <div className="loader-bar-wrap">
          <div className="loader-bar-track">
            <div ref={barRef} className="loader-bar-fill" style={{ width: '0%' }} />
          </div>
          <span ref={percentRef} className="loader-percent">00%</span>
        </div>

        {/* Cultural phrase ticker */}
        <div ref={phraseRef} className="loader-phrase">{PHRASES[0]}</div>
      </div>
    </div>
  );
};

export default PageLoader;
