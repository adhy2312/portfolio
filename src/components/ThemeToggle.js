import React from 'react';
import './ThemeToggle.css';

const ThemeToggle = ({ toggleTheme, theme }) => {
  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;
