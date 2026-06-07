import React from 'react';
import { useSiteMode } from '../contexts/SiteModeContext';
import { FiMoon, FiSun } from 'react-icons/fi';

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useSiteMode();

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleDarkMode}
      style={{ 
        position: 'fixed', 
        top: '1rem', 
        right: '1rem', 
        zIndex: 1001,
        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        color: isDarkMode ? '#fff' : '#000',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}
      aria-label="Toggle Dark Mode"
    >
      {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
};

export default DarkModeToggle;
