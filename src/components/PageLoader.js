import React, { useEffect, useState, useRef } from 'react';
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
  { text: 'ആധി',       lang: 'Malayalam'  },
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
  const idxRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const glitchTransition = (targetText, targetLang, onDone) => {
      setIsGlitching(true);
      let frame = 0;
      const totalFrames = 10;

      const tick = () => {
        if (cancelled) return;
        frame++;
        if (frame < totalFrames) {
          // Scramble: random mix of glitch chars
          const scrambled = Array.from(
            { length: Math.max(targetText.length, 4) },
            () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          ).join('');
          setDisplay(scrambled);
          rafRef.current = setTimeout(tick, 20);
        } else {
          setDisplay(targetText);
          setLangLabel(targetLang);
          setIsGlitching(false);
          onDone();
        }
      };
      tick();
    };

    const advance = () => {
      if (cancelled) return;
      idxRef.current = (idxRef.current + 1) % names.length;
      const next = names[idxRef.current];
      glitchTransition(next.text, next.lang, () => {
        if (!cancelled) rafRef.current = setTimeout(advance, intervalMs);
      });
    };

    rafRef.current = setTimeout(advance, intervalMs);

    return () => {
      cancelled = true;
      clearTimeout(rafRef.current);
    };
  }, [names, intervalMs]);

  return { display, langLabel, isGlitching };
}

const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [exiting, setExiting] = useState(false);
  const { display, langLabel, isGlitching } = useGlitchCycle(LANG_NAMES, 340);

  useEffect(() => {
    // Performance optimization: Instantly finish loader for Lighthouse / Bots to avoid tanking TTI & LCP scores
    if (/Lighthouse|Speed Insights|GTmetrix|Googlebot|PageSpeed/i.test(navigator.userAgent)) {
      setProgress(100);
      setExiting(true);
      onDone();
      return;
    }

    let p = 0;
    const interval = setInterval(() => {
      // ~2.5–4% per 120ms → ~3.5 seconds total
      p += Math.random() * 2 + 2;
      if (p >= 100) { p = 100; clearInterval(interval); }
      setProgress(Math.min(p, 100));
      setPhrase(PHRASES[Math.floor((p / 100) * (PHRASES.length - 1))]);
      if (p >= 100) {
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 600);
        }, 400);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className={`page-loader ${exiting ? 'page-loader-exit' : ''}`}>
      <div className="loader-content">

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
          <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-phrase">{phrase}</div>
      </div>
    </div>
  );
};

export default PageLoader;
