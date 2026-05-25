import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SiteModeContext = createContext();

// All available modes
export const MODES = {
  NORMAL: 'normal',
  RECRUITER: 'recruiter',
  EXPERT: 'expert',
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

  // Persist mode
  const setMode = useCallback((m) => {
    setModeState(m);
    try { localStorage.setItem('portfolio-mode', m); } catch {}
  }, []);

  // Toggle a single a11y flag
  const toggleA11y = useCallback((flag) => {
    setA11yState(prev => {
      const next = { ...prev, [flag]: !prev[flag] };
      try { localStorage.setItem('portfolio-a11y', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Apply body classes reactively
  useEffect(() => {
    const cl = document.body.classList;
    // Remove old mode classes
    cl.remove('mode-recruiter', 'mode-expert', 'mode-experimental', 'mode-normal', 'mode-default');
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
  }, [mode, a11y]);

  // Section visibility based on mode
  const isSectionVisible = useCallback((sectionName) => {
    if (mode === MODES.RECRUITER) {
      // Recruiters only see what matters
      const recruiterSections = [
        'Hero', 'About', 'Skills', 'Experience', 'MyWorks', 
        'Achievements', 'TrustedBy', 'Testimonials', 'Contact', 'Footer', 'StackVisualizer'
      ];
      return recruiterSections.includes(sectionName);
    }
    // Expert and Experimental show everything
    return true;
  }, [mode]);

  const value = {
    mode,
    setMode,
    a11y,
    toggleA11y,
    isSectionVisible,
    isRecruiter: mode === MODES.RECRUITER,
    isExpert: mode === MODES.EXPERT,
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
