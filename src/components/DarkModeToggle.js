import React from 'react';

function DarkModeToggle({ toggleDarkMode, isDarkMode }) {
  return (
    <button className="dark-toggle" onClick={toggleDarkMode}>
      {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}

export default DarkModeToggle;
