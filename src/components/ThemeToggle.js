import React from 'react';

const ThemeToggle = ({ toggleTheme, theme }) => {
  return (
    <div style={{ textAlign: 'right', padding: '10px 20px' }}>
      <button onClick={toggleTheme}>
        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
};

export default ThemeToggle;
