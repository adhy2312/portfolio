import React, { useState, lazy, Suspense } from 'react';
import './GamesHub.css';

const TicTacToe = lazy(() => import('./TicTacToe'));
const ZipGame = lazy(() => import('./ZipGame'));
const SnakeGame = lazy(() => import('./SnakeGame'));

export default function GamesHub({ onClose }) {
  const isMobile = window.innerWidth <= 768;
  // Default to Snake
  const [selectedGame, setSelectedGame] = useState('snake');

  return (
    <div className="games-hub-overlay">
      <div className="games-hub-container">
        
        {/* Toggle Bar */}
        <div className="games-hub-toggle-bar">
          <button 
            className={`games-hub-tab ${selectedGame === 'snake' ? 'active' : ''}`}
            onClick={() => setSelectedGame('snake')}
          >
            Snake Xenzia
          </button>
          
          <button 
            className={`games-hub-tab ${selectedGame === 'other' ? 'active' : ''}`}
            onClick={() => setSelectedGame('other')}
          >
            {isMobile ? 'Zip Game' : 'Tic Tac Toe'}
          </button>

          <button className="games-hub-close" onClick={onClose} aria-label="Close Games Hub">
            ×
          </button>
        </div>

        {/* Game Render Area */}
        <div className="games-hub-content">
          <Suspense fallback={<div className="games-hub-loading">Booting cartridge...</div>}>
            {selectedGame === 'snake' && (
              <SnakeGame onClose={onClose} />
            )}
            
            {selectedGame === 'other' && !isMobile && (
              <TicTacToe onClose={onClose} />
            )}
            
            {selectedGame === 'other' && isMobile && (
              <ZipGame onClose={onClose} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
