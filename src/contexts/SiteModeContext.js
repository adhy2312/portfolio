import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { client } from '../sanity';

const SiteModeContext = createContext();

// All available modes
export const MODES = {
  NORMAL: 'normal',
  RECRUITER: 'recruiter',
  PHOTOGRAPHER: 'photographer',
  EXPERIMENTAL: 'experimental',
};

// Accessibility sub-flags
const DEFAULT_A11Y = {
  reducedMotion: false,
  lowGpu: false,
  highReadability: false,
  simplifiedInteraction: false,
};

export function SiteModeProvider({ children }) {
  const [visualSettings, setVisualSettings] = useState(null);

  useEffect(() => {
    client.fetch('*[_type == "visualSettings"][0]')
      .then(data => {
        if (data) setVisualSettings(data);
      })
      .catch(err => console.error('Failed to fetch visual settings:', err));
  }, []);

  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('portfolio-mode') || MODES.NORMAL; }
    catch { return MODES.NORMAL; }
  });

  const [a11y, setA11yState] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio-a11y');
      if (saved) return JSON.parse(saved);
      
      // Auto-detect hardware for first-time visitors
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      const isLowEnd = isMobile || cores <= 4 || memory <= 4;
      
      return {
        ...DEFAULT_A11Y,
        lowGpu: isLowEnd,
        reducedMotion: prefersReducedMotion,
      };
    } catch { return { ...DEFAULT_A11Y }; }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio-dark-mode');
      if (saved !== null) return JSON.parse(saved);
      return false; // Force light mode as the default aesthetic
    } catch { return false; }
  });

  // Persist mode
  const setMode = useCallback((m) => {
    setModeState(m);
    try { localStorage.setItem('portfolio-mode', m); } catch {}
  }, []);

  const toggleA11y = useCallback((flag) => {
    setA11yState(prev => {
      const next = { ...prev, [flag]: !prev[flag] };
      try { localStorage.setItem('portfolio-a11y', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem('portfolio-dark-mode', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Listen for Ghost In The Machine direct mode switches
  useEffect(() => {
    const handleDirectSwitch = (e) => {
      const targetMode = e.detail;
      setMode(targetMode);
    };
    window.addEventListener('switch-mode-direct', handleDirectSwitch);
    return () => window.removeEventListener('switch-mode-direct', handleDirectSwitch);
  }, [setMode]);

  // Apply body classes reactively
  useEffect(() => {
    const cl = document.body.classList;
    // Remove old mode classes
    cl.remove('mode-recruiter', 'mode-photographer', 'mode-experimental', 'mode-normal', 'mode-default');
    cl.add(`mode-${mode}`);

    // A11y classes
    cl.toggle('a11y-reduced-motion', a11y.reducedMotion);
    cl.toggle('a11y-low-gpu', a11y.lowGpu);
    cl.toggle('a11y-high-readability', a11y.highReadability);
    cl.toggle('a11y-simplified', a11y.simplifiedInteraction);

    // Also respect OS prefers-reduced-motion
    if (a11y.reducedMotion) {
      document.documentElement.style.setProperty('--transition-speed', '0s');
    } else {
      document.documentElement.style.removeProperty('--transition-speed');
    }

    // Dark mode class
    cl.toggle('dark-mode', isDarkMode);

    // Apply Sanity visual settings if available
    if (visualSettings) {
      const {
        fontHeading, fontBody, fontEditorial, accentColor,
        bgPrimaryLight, bgPrimaryDark, bgSecondaryLight, bgSecondaryDark,
        bgTertiaryLight, bgTertiaryDark, textPrimaryLight, textPrimaryDark,
        textSecondaryLight, textSecondaryDark, showGrid, gridSize,
        gridOpacityLight, gridOpacityDark
      } = visualSettings;

      const rootStyle = document.documentElement.style;

      const loadGoogleFont = (fontName) => {
        if (!fontName) return;
        const formattedName = fontName.trim().replace(/\s+/g, '+');
        const linkId = `google-font-${formattedName.toLowerCase()}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700;800;900&display=swap`;
          document.head.appendChild(link);
        }
      };

      if (fontHeading) { loadGoogleFont(fontHeading); rootStyle.setProperty('--font-heading', `'${fontHeading}', sans-serif`); }
      if (fontBody) { loadGoogleFont(fontBody); rootStyle.setProperty('--font-body', `'${fontBody}', sans-serif`); }
      if (fontEditorial) { loadGoogleFont(fontEditorial); rootStyle.setProperty('--font-editorial', `'${fontEditorial}', serif`); }

      if (accentColor) {
        rootStyle.setProperty('--accent-primary', accentColor);
        if (accentColor.startsWith('#')) {
          const hex = accentColor.replace('#', '');
          let r = 0, g = 0, b = 0;
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16);
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16);
          }
          rootStyle.setProperty('--accent-primary-rgb', `${r}, ${g}, ${b}`);
        }
      }

      rootStyle.setProperty('--grid-display', showGrid === false ? 'none' : 'block');
      if (gridSize) rootStyle.setProperty('--grid-size', `${gridSize}px`);

      if (isDarkMode) {
        if (bgPrimaryDark) rootStyle.setProperty('--bg-primary', bgPrimaryDark);
        if (bgSecondaryDark) rootStyle.setProperty('--bg-secondary', bgSecondaryDark);
        if (bgTertiaryDark) rootStyle.setProperty('--bg-tertiary', bgTertiaryDark);
        if (textPrimaryDark) rootStyle.setProperty('--text-primary', textPrimaryDark);
        if (textSecondaryDark) rootStyle.setProperty('--text-secondary', textSecondaryDark);
        if (gridOpacityDark !== undefined) rootStyle.setProperty('--grid-opacity', gridOpacityDark);
      } else {
        if (bgPrimaryLight) rootStyle.setProperty('--bg-primary', bgPrimaryLight);
        if (bgSecondaryLight) rootStyle.setProperty('--bg-secondary', bgSecondaryLight);
        if (bgTertiaryLight) rootStyle.setProperty('--bg-tertiary', bgTertiaryLight);
        if (textPrimaryLight) rootStyle.setProperty('--text-primary', textPrimaryLight);
        if (textSecondaryLight) rootStyle.setProperty('--text-secondary', textSecondaryLight);
        if (gridOpacityLight !== undefined) rootStyle.setProperty('--grid-opacity', gridOpacityLight);
      }
    }
  }, [mode, a11y, isDarkMode, visualSettings]);

  // Section visibility based on mode
  const isSectionVisible = useCallback((sectionName) => {
    if (mode === MODES.RECRUITER) {
      // Streamlined view, hide complex/abstract sections
      const hiddenInRecruiter = ['TechDNA', 'NeuralMap', 'StackVisualizer', 'Timeline', 'DigitalScars', 'KineticMarquee', 'ScrollCanvasSequence'];
      return !hiddenInRecruiter.includes(sectionName);
    }
    
    if (mode === MODES.PHOTOGRAPHER) {
      // Tech-heavy view, hide purely aesthetic sections
      const hiddenInPhotographer = ['DigitalScars', 'TrustedBy', 'TechDNA', 'Timeline'];
      return !hiddenInPhotographer.includes(sectionName);
    }
    
    if (mode === MODES.NORMAL) {
       // Standard view, hide some deep experimental features
       const hiddenInNormal = ['DigitalScars', 'NeuralMap', 'ScrollCanvasSequence'];
       return !hiddenInNormal.includes(sectionName);
    }

    if (mode === MODES.EXPERIMENTAL) {
      // Show everything, it's the lab!
      return true;
    }

    return true;
  }, [mode]);

  const value = {
    mode,
    setMode,
    a11y,
    toggleA11y,
    isDarkMode,
    toggleDarkMode,
    isSectionVisible,
    isRecruiter: mode === MODES.RECRUITER,
    isPhotographer: mode === MODES.PHOTOGRAPHER,
    isExperimental: mode === MODES.EXPERIMENTAL,
  };

  return (
    <SiteModeContext.Provider value={value}>
      {children}
    </SiteModeContext.Provider>
  );
}

export function useSiteMode() {
  const ctx = useContext(SiteModeContext);
  if (!ctx) throw new Error('useSiteMode must be used within SiteModeProvider');
  return ctx;
}
