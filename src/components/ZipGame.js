import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ZipGame.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiRefreshCw, FiCheckCircle, FiInfo } from 'react-icons/fi';

/**
 * Generate a Zip level that matches LinkedIn's logic:
 * 1. Generate a Hamiltonian path.
 * 2. Randomly pick points as numbers.
 * 3. Place barriers in spots NOT used by the path.
 */
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

  // Numbers (dots)
  const numCount = size === 4 ? 4 : 6;
  const numbers = [{ ...solutionPath[0], val: 1 }];
  const segment = Math.floor((totalCells - 1) / (numCount - 1));
  
  for (let i = 1; i < numCount - 1; i++) {
    const idx = Math.min(i * segment + Math.floor(Math.random() * 2), totalCells - 2);
    numbers.push({ ...solutionPath[idx], val: i + 1 });
  }
  numbers.push({ ...solutionPath[totalCells - 1], val: numCount });

  // Barriers: Place some walls between adjacent cells NOT on the solution path
  const barriers = [];
  const allPossibleWalls = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r < size - 1) allPossibleWalls.push({ r1: r, c1: c, r2: r + 1, c2: c, type: 'h' });
      if (c < size - 1) allPossibleWalls.push({ r1: r, c1: c, r2: r, c2: c + 1, type: 'v' });
    }
  }

  // Filter out walls that would block the solution path
  const validBarriers = allPossibleWalls.filter(wall => {
    // Check if the solution path crosses this wall
    for (let i = 0; i < solutionPath.length - 1; i++) {
      const p1 = solutionPath[i];
      const p2 = solutionPath[i + 1];
      if ((p1.r === wall.r1 && p1.c === wall.c1 && p2.r === wall.r2 && p2.c === wall.c2) ||
          (p1.r === wall.r2 && p1.c === wall.c2 && p2.r === wall.r1 && p2.c === wall.c1)) {
        return false;
      }
    }
    return true;
  });

  // Randomly select some barriers
  const barrierCount = size === 4 ? 3 : 5;
  for (let i = 0; i < barrierCount; i++) {
    if (validBarriers.length > 0) {
      const idx = Math.floor(Math.random() * validBarriers.length);
      barriers.push(validBarriers.splice(idx, 1)[0]);
    }
  }

  return {
    id,
    size,
    numbers,
    barriers,
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

  useEffect(() => {
    const size = levelCount <= 3 ? 4 : 5;
    const newLevel = generateZipLevel(levelCount, size);
    setLevel(newLevel);
    setPath([{ r: newLevel.numbers[0].r, c: newLevel.numbers[0].c }]);
    setWon(false);
  }, [levelCount]);

  const handleCellAction = useCallback((r, c) => {
    if (won || !level) return;

    const last = path[path.length - 1];
    if (!last) return;

    // Check adjacency
    const isAdjacent = (Math.abs(last.r - r) === 1 && last.c === c) || 
                       (Math.abs(last.c - c) === 1 && last.r === r);

    // If touching the previous cell, undo last move
    if (path.length > 1 && path[path.length - 2].r === r && path[path.length - 2].c === c) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    if (!isAdjacent) return;

    // Cannot revisit cells
    if (path.some(p => p.r === r && p.c === c)) return;

    // CHECK FOR BARRIERS
    const hasBarrier = level.barriers.some(b => 
      (b.r1 === last.r && b.c1 === last.c && b.r2 === r && b.c2 === c) ||
      (b.r1 === r && b.c1 === c && b.r2 === last.r && b.c2 === last.c)
    );
    if (hasBarrier) return;

    // Check if we hit a number cell
    const targetNum = level.numbers.find(n => n.r === r && n.c === c);
    
    // Find what the next number in sequence is
    const visitedNums = level.numbers.filter(n => path.some(p => p.r === n.r && p.c === n.c));
    const currentMaxVal = visitedNums.length > 0 ? Math.max(...visitedNums.map(n => n.val)) : 1;
    const nextExpectedVal = currentMaxVal + 1;

    if (targetNum && targetNum.val !== nextExpectedVal) {
      // Hit a number but it's not the next in sequence
      return;
    }

    const newPath = [...path, { r, c }];
    setPath(newPath);

    // Win Condition
    const allNumbersVisited = level.numbers.every(n => 
      newPath.some(p => p.r === n.r && p.c === n.c)
    );
    const allCellsFilled = newPath.length === level.size * level.size;
    const lastIsFinalNumber = targetNum && targetNum.val === Math.max(...level.numbers.map(n => n.val));

    if (allNumbersVisited && allCellsFilled && lastIsFinalNumber) {
      setWon(true);
    }
  }, [won, level, path]);

  const onTouchMove = (e) => {
    if (!isDrawing || won) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.dataset.r) {
      const r = parseInt(element.dataset.r);
      const c = parseInt(element.dataset.c);
      handleCellAction(r, c);
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
      onClose();
    }
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
            <span className="zip-badge">DAILY CHALLENGE</span>
            <h2>ZIP_LOGIC</h2>
          </div>
          <button className="zip-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="zip-body">
          <div className="zip-stats">
            <span>LEVEL {level.id}</span>
            <span>{path.length} / {level.size * level.size}</span>
          </div>

          <div 
            className="zip-grid-container"
            style={{ '--grid-size': level.size }}
          >
            <div 
              className="zip-grid" 
              ref={gridRef}
              onMouseDown={() => setIsDrawing(true)}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              onTouchStart={() => setIsDrawing(true)}
              onTouchEnd={() => setIsDrawing(false)}
              onTouchMove={onTouchMove}
            >
              {Array.from({ length: level.size }).map((_, r) => (
                <div key={r} className="zip-row">
                  {Array.from({ length: level.size }).map((_, c) => {
                    const num = level.numbers.find(n => n.r === r && n.c === c);
                    const inPathIdx = path.findIndex(p => p.r === r && p.c === c);
                    const isLast = inPathIdx === path.length - 1 && path.length > 0;
                    
                    return (
                      <div 
                        key={c}
                        data-r={r}
                        data-c={c}
                        className={`zip-cell ${inPathIdx !== -1 ? 'in-path' : ''} ${isLast ? 'path-head' : ''} ${num ? 'num-cell' : ''}`}
                        onMouseEnter={() => isDrawing && handleCellAction(r, c)}
                        onClick={() => handleCellAction(r, c)}
                      >
                        {num && <span className="cell-dot">{num.val}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Barriers */}
              {level.barriers.map((b, i) => {
                const cellSize = 100 / level.size;
                const style = b.type === 'h' 
                  ? { top: `${(b.r1 + 1) * cellSize}%`, left: `${b.c1 * cellSize + 10 / level.size}%`, width: `${cellSize - 20 / level.size}%`, height: '4px' }
                  : { left: `${(b.c1 + 1) * cellSize}%`, top: `${b.r1 * cellSize + 10 / level.size}%`, height: `${cellSize - 20 / level.size}%`, width: '4px' };
                return <div key={i} className="zip-barrier" style={style} />;
              })}

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
          </div>

          <div className="zip-controls">
            <button className="zip-btn-icon" onClick={resetLevel}>
              <FiRefreshCw /> Reset
            </button>
            <div className="zip-hint">
              <FiInfo /> Fill every cell in order.
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
                <h3>SOLVED!</h3>
                <p>Grid successfully zipped.</p>
                <button className="btn-primary" onClick={nextLevel}>
                  {levelCount < 10 ? 'NEXT LEVEL' : 'DONE'}
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
