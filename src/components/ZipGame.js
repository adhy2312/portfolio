import React, { useState, useEffect, useRef } from 'react';
import './ZipGame.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiRefreshCw, FiCheckCircle, FiInfo } from 'react-icons/fi';

const generateZipLevel = (id, size) => {
  const totalCells = size * size;
  let solutionPath = [];
  
  const findHamiltonian = (r, c, visited) => {
    if (visited.length === totalCells) {
      solutionPath = visited;
      return true;
    }

    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.some(v => v.r === nr && v.c === nc)) {
        if (findHamiltonian(nr, nc, [...visited, { r: nr, c: nc }])) return true;
      }
    }
    return false;
  };

  const start = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
  findHamiltonian(start.r, start.c, [start]);

  const numCount = size === 4 ? 3 : 4;
  const numbers = [{ ...solutionPath[0], val: 1 }];
  const segment = Math.floor((totalCells - 1) / (numCount - 1));
  
  for (let i = 1; i < numCount - 1; i++) {
    const idx = Math.min(i * segment + Math.floor(Math.random() * 2), totalCells - 2);
    numbers.push({ ...solutionPath[idx], val: i + 1 });
  }
  numbers.push({ ...solutionPath[totalCells - 1], val: numCount });

  return {
    id,
    size,
    numbers,
    hint: `Connect 1 to ${numCount} while filling all ${totalCells} squares.`
  };
};

const ZipGame = ({ onClose }) => {
  const [level, setLevel] = useState(null);
  const [levelCount, setLevelCount] = useState(1);
  const [path, setPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [won, setWon] = useState(false);
  
  const gridRef = useRef(null);

  // Initialize first level
  useEffect(() => {
    const size = levelCount <= 3 ? 4 : 5;
    const newLevel = generateZipLevel(levelCount, size);
    setLevel(newLevel);
    setPath([{ r: newLevel.numbers[0].r, c: newLevel.numbers[0].c }]);
    setWon(false);
  }, [levelCount]);


  const handleCellAction = (r, c) => {
    if (won) return;

    // Check if cell is adjacent to the last path cell
    const last = path[path.length - 1];
    if (!last) return;

    const isAdjacent = (Math.abs(last.r - r) === 1 && last.c === c) || 
                       (Math.abs(last.c - c) === 1 && last.r === r);

    // If clicking the previous cell, undo last move
    if (path.length > 1 && path[path.length - 2].r === r && path[path.length - 2].c === c) {
      setPath(path.slice(0, -1));
      return;
    }

    if (!isAdjacent) return;

    // Cannot revisit cells
    if (path.some(p => p.r === r && p.c === c)) return;

    // Check if we hit a number cell
    const targetNum = level.numbers.find(n => n.r === r && n.c === c);
    const nextExpectedVal = level.numbers.find(n => {
      const currentMaxValInPath = Math.max(...level.numbers.filter(ln => 
        path.some(p => p.r === ln.r && p.c === ln.c)
      ).map(ln => ln.val));
      return n.val === currentMaxValInPath + 1;
    })?.val;

    if (targetNum && targetNum.val !== nextExpectedVal) {
      // Hit a number but it's not the next in sequence
      return;
    }

    const newPath = [...path, { r, c }];
    setPath(newPath);

    // Check Win Condition
    const allNumbersVisited = level.numbers.every(n => 
      newPath.some(p => p.r === n.r && p.c === n.c)
    );
    const allCellsFilled = newPath.length === level.size * level.size;
    const lastIsFinalNumber = targetNum && targetNum.val === Math.max(...level.numbers.map(n => n.val));

    if (allNumbersVisited && allCellsFilled && lastIsFinalNumber) {
      setWon(true);
    }
  };

  const resetLevel = () => {
    const startNum = level.numbers.find(n => n.val === 1);
    setPath([{ r: startNum.r, c: startNum.c }]);
    setWon(false);
  };

  const nextLevel = () => {
    if (levelCount < 10) {
      setLevelCount(levelCount + 1);
    } else {
      onClose(); // Stop after 10 levels or continue infinitely if you want
    }
  };


  const renderGrid = () => {
    const rows = [];
    for (let r = 0; r < level.size; r++) {
      const cells = [];
      for (let c = 0; c < level.size; c++) {
        const num = level.numbers.find(n => n.r === r && n.c === c);
        const inPathIdx = path.findIndex(p => p.r === r && p.c === c);
        const isLast = inPathIdx === path.length - 1 && path.length > 0;
        
        cells.push(
          <div 
            key={`${r}-${c}`}
            className={`zip-cell ${inPathIdx !== -1 ? 'in-path' : ''} ${isLast ? 'path-head' : ''} ${num ? 'num-cell' : ''}`}
            onClick={() => handleCellAction(r, c)}
            onMouseEnter={() => isDrawing && handleCellAction(r, c)}
          >
            {num && <span className="cell-number">{num.val}</span>}
            {inPathIdx !== -1 && !num && <div className="path-dot" />}
          </div>
        );
      }
      rows.push(<div key={r} className="zip-row">{cells}</div>);
    }
    return rows;
  };

  if (!level) return null;

  return (
    <div className="zip-overlay">

      <motion.div 
        className="zip-modal glass-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="zip-header">
          <div className="zip-title">
            <span className="zip-badge">DAILY PUZZLE</span>
            <h2>ZIP_LOGIC</h2>
          </div>
          <button className="zip-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="zip-body">
          <div className="zip-stats">
            <span>LEVEL {level.id}</span>
            <span>{path.length} / {level.size * level.size} CELLS</span>
          </div>

          <div 
            className="zip-grid" 
            ref={gridRef}
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            onTouchStart={() => setIsDrawing(true)}
            onTouchEnd={() => setIsDrawing(false)}
            style={{ 
              gridTemplateRows: `repeat(${level.size}, 1fr)`,
              '--grid-size': level.size
            }}
          >
            {renderGrid()}
            
            {/* SVG Overlay for Path Lines */}
            <svg className="path-svg">
              {path.map((p, i) => {
                if (i === 0) return null;
                const prev = path[i-1];
                const cellSize = 100 / level.size;
                return (
                  <line 
                    key={i}
                    x1={`${prev.c * cellSize + cellSize/2}%`}
                    y1={`${prev.r * cellSize + cellSize/2}%`}
                    x2={`${p.c * cellSize + cellSize/2}%`}
                    y2={`${p.r * cellSize + cellSize/2}%`}
                    className="path-line"
                  />
                );
              })}
            </svg>
          </div>

          <div className="zip-controls">
            <button className="zip-btn-icon" onClick={resetLevel} title="Reset">
              <FiRefreshCw /> Reset
            </button>
            <div className="zip-hint">
              <FiInfo /> {level.hint}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {won && (
            <motion.div 
              className="zip-win-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="zip-win-content">
                <FiCheckCircle className="win-icon" />
                <h3>GRID COMPLETED!</h3>
                <p>You've connected all sequences and filled the matrix.</p>
                <button className="btn-primary" onClick={nextLevel}>
                  {levelCount < 10 ? 'NEXT LEVEL' : 'CLOSE GAME'}
                </button>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ZipGame;
