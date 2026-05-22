import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiRefreshCw } from 'react-icons/fi';
import './TicTacToe.css';

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function calcWinner(squares) {
  for (const [a, b, c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  if (squares.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

function minimax(squares, isMax, depth = 0) {
  const result = calcWinner(squares);
  if (result) {
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    return 0;
  }
  const scores = [];
  squares.forEach((sq, i) => {
    if (!sq) {
      const next = [...squares];
      next[i] = isMax ? 'O' : 'X';
      scores.push({ i, score: minimax(next, !isMax, depth + 1) });
    }
  });
  return isMax
    ? Math.max(...scores.map(s => s.score))
    : Math.min(...scores.map(s => s.score));
}

function getBestMove(squares) {
  let best = -Infinity, move = -1;
  squares.forEach((sq, i) => {
    if (!sq) {
      const next = [...squares];
      next[i] = 'O';
      const score = minimax(next, false);
      if (score > best) { best = score; move = i; }
    }
  });
  return move;
}

const TicTacToe = ({ onClose }) => {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const result = calcWinner(squares);

  const handleClick = useCallback((i) => {
    if (squares[i] || result || !xIsNext) return;
    const next = [...squares];
    next[i] = 'X';
    setSquares(next);
    setXIsNext(false);

    // AI move after short delay
    const aiResult = calcWinner(next);
    if (!aiResult) {
      setTimeout(() => {
        const aiMove = getBestMove(next);
        if (aiMove !== -1) {
          const afterAI = [...next];
          afterAI[aiMove] = 'O';
          setSquares(afterAI);
          const finalResult = calcWinner(afterAI);
          if (finalResult) {
            setScores(s => ({ ...s, [finalResult.winner]: (s[finalResult.winner] || 0) + 1 }));
          }
        }
        setXIsNext(true);
      }, 350);
    } else {
      setScores(s => ({ ...s, [aiResult.winner]: (s[aiResult.winner] || 0) + 1 }));
      setXIsNext(true);
    }
  }, [squares, result, xIsNext]);

  const reset = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  let status;
  if (result) {
    status = result.winner === 'draw' ? "It's a draw! 🤝" : result.winner === 'X' ? 'You won! 🎉' : 'AI wins 🤖';
  } else {
    status = xIsNext ? 'Your turn (X)' : 'AI thinking...';
  }

  return (
    <motion.div
      className="ttt-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="ttt-modal"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        {/* Header */}
        <div className="ttt-header">
          <div className="ttt-title">
            <span className="ttt-badge">EASTER EGG 🥚</span>
            <h2>TIC_TAC_TOE</h2>
            <p className="ttt-subtitle">You vs. AI — good luck!</p>
          </div>
          <button className="ttt-close" onClick={onClose}><FiX /></button>
        </div>

        {/* Score bar */}
        <div className="ttt-scores">
          <div className="ttt-score-item">
            <span className="ttt-score-label">YOU (X)</span>
            <span className="ttt-score-val x-color">{scores.X}</span>
          </div>
          <div className="ttt-score-sep">–</div>
          <div className="ttt-score-item">
            <span className="ttt-score-label">DRAW</span>
            <span className="ttt-score-val draw-color">{scores.draw}</span>
          </div>
          <div className="ttt-score-sep">–</div>
          <div className="ttt-score-item">
            <span className="ttt-score-label">AI (O)</span>
            <span className="ttt-score-val o-color">{scores.O}</span>
          </div>
        </div>

        {/* Status */}
        <div className={`ttt-status ${result ? (result.winner === 'X' ? 'status-win' : result.winner === 'draw' ? 'status-draw' : 'status-lose') : ''}`}>
          {status}
        </div>

        {/* Board */}
        <div className="ttt-board">
          {squares.map((sq, i) => {
            const isWinCell = result?.line?.includes(i);
            return (
              <motion.button
                key={i}
                className={`ttt-cell ${sq ? `ttt-${sq.toLowerCase()}` : ''} ${isWinCell ? 'ttt-win-cell' : ''}`}
                onClick={() => handleClick(i)}
                whileHover={!sq && !result ? { scale: 1.08 } : {}}
                whileTap={!sq && !result ? { scale: 0.95 } : {}}
                initial={sq ? { scale: 0, rotate: -15 } : false}
                animate={sq ? { scale: 1, rotate: 0 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {sq}
              </motion.button>
            );
          })}
        </div>

        {/* Controls */}
        <button className="ttt-reset" onClick={reset}>
          <FiRefreshCw /> New Game
        </button>
      </motion.div>
    </motion.div>
  );
};

export default TicTacToe;
