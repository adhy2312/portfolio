import React, { useState, useEffect, useRef } from 'react';
import { FiActivity, FiRadio, FiVolume2, FiVolumeX, FiSliders, FiCpu } from 'react-icons/fi';
import './CircuitSimulatorSDR.css';

/**
 * Interactive WebGL / Canvas Circuit Simulator & GNU Radio SDR Waterfall
 * Inspired by Adhithya Mohan's ECE background in MATLAB, Simulink, Simscape, and GNU Radio.
 */
const PRESETS = [
  {
    name: '433.92 MHz ISM Beacon',
    category: 'SDR RF',
    centerFreq: 433.92,
    bandwidth: 250,
    r: 50,
    l: 15,
    c: 2.2,
    inputFreq: 1200,
    waveform: 'sine',
    mode: 'sdr'
  },
  {
    name: 'RLC High-Q Resonance',
    category: 'Circuit Tank',
    centerFreq: 145.0,
    bandwidth: 100,
    r: 12,
    l: 35,
    c: 4.7,
    inputFreq: 392,
    waveform: 'square',
    mode: 'oscilloscope'
  },
  {
    name: 'Underdamped Ringing Transient',
    category: 'Transient Analysis',
    centerFreq: 10.7,
    bandwidth: 200,
    r: 15,
    l: 50,
    c: 0.8,
    inputFreq: 795,
    waveform: 'chirp',
    mode: 'oscilloscope'
  },
  {
    name: 'FM Broadcast Multiplex (101.1 MHz)',
    category: 'SDR RF',
    centerFreq: 101.1,
    bandwidth: 1200,
    r: 75,
    l: 8,
    c: 10.0,
    inputFreq: 1000,
    waveform: 'am',
    mode: 'sdr'
  },
  {
    name: 'Butterworth Audio Filter',
    category: 'DSP Analog',
    centerFreq: 2.4,
    bandwidth: 50,
    r: 120,
    l: 22,
    c: 15.0,
    inputFreq: 250,
    waveform: 'triangle',
    mode: 'oscilloscope'
  }
];

export default function CircuitSimulatorSDR({ onClose }) {
  const [viewMode, setViewMode] = useState('oscilloscope'); // 'oscilloscope' | 'sdr'
  
  // Circuit Components
  const [resistance, setResistance] = useState(47); // Ohms
  const [inductance, setInductance] = useState(25); // milliHenries
  const [capacitance, setCapacitance] = useState(3.3); // microFarads
  const [inputFreq, setInputFreq] = useState(550); // Hertz
  const [waveform, setWaveform] = useState('sine'); // 'sine' | 'square' | 'triangle' | 'am' | 'chirp'
  const [bypassC, setBypassC] = useState(false);
  const [bypassL, setBypassL] = useState(false);
  
  // SDR Parameters
  const [centerFreq, setCenterFreq] = useState(433.92); // MHz
  const [bandwidth, setBandwidth] = useState(250); // kHz
  const [gainDb] = useState(28); // dB
  const [noiseFloor] = useState(-85); // dBFS

  // Audio Sonification
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const oscNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Canvases
  const oscCanvasRef = useRef(null);
  const sdrCanvasRef = useRef(null);
  const waterfallBufferRef = useRef([]);

  // Calculate Circuit Physics
  const effL = bypassL ? 0.0001 : inductance * 1e-3; // Henries
  const effC = bypassC ? 0.00001 : capacitance * 1e-6; // Farads
  const effR = Math.max(0.1, resistance); // Ohms

  // Resonant Frequency f0 = 1 / (2 * pi * sqrt(LC))
  const resonantFreq = 1 / (2 * Math.PI * Math.sqrt(effL * effC));
  // Quality Factor Q = (1 / R) * sqrt(L / C)
  const qualityFactor = (1 / effR) * Math.sqrt(effL / effC);
  // Damping ratio zeta = (R / 2) * sqrt(C / L)
  const dampingRatio = (effR / 2) * Math.sqrt(effC / effL);
  
  let dampingClass = 'Underdamped';
  if (dampingRatio > 1.05) dampingClass = 'Overdamped';
  else if (dampingRatio >= 0.95 && dampingRatio <= 1.05) dampingClass = 'Critically Damped';

  // Reactance and Impedance at current input frequency
  const omega = 2 * Math.PI * inputFreq;
  const xl = bypassL ? 0 : omega * effL;
  const xc = bypassC ? 0 : 1 / (omega * effC);
  const totalImpedance = Math.sqrt(effR * effR + Math.pow(xl - xc, 2));
  const phaseAngleDeg = (Math.atan2(xl - xc, effR) * 180) / Math.PI;

  // Apply preset
  const applyPreset = (preset) => {
    setResistance(preset.r);
    setInductance(preset.l);
    setCapacitance(preset.c);
    setInputFreq(preset.inputFreq);
    setWaveform(preset.waveform);
    setCenterFreq(preset.centerFreq);
    setBandwidth(preset.bandwidth);
    setViewMode(preset.mode);
    setBypassC(false);
    setBypassL(false);
  };

  // Oscilloscope Animation Loop
  useEffect(() => {
    if (viewMode !== 'oscilloscope') return;
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      phase += 0.04;

      // Dark CRT backdrop with phosphor persistence fade
      ctx.fillStyle = 'rgba(5, 11, 22, 0.22)';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Lines (Scope divisions)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      const stepX = width / 10;
      const stepY = height / 8;
      ctx.beginPath();
      for (let x = 0; x <= width; x += stepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += stepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center crosshair axis
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Calculate RLC transient / frequency response attenuation
      const freqRatio = inputFreq / Math.max(1, resonantFreq);
      const denominator = Math.sqrt(Math.pow(1 - freqRatio * freqRatio, 2) + Math.pow(freqRatio / qualityFactor, 2));
      const rlcGain = Math.min(3.5, 1 / Math.max(0.1, denominator));
      const centerY = height / 2;
      const amp = (height * 0.35) * Math.min(1.2, rlcGain * 0.7);

      // Draw Primary Output Waveform V_out(t)
      ctx.beginPath();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;

      for (let x = 0; x < width; x++) {
        const t = (x / width) * (inputFreq * 0.015) + phase;
        let val = 0;

        if (waveform === 'sine') {
          val = Math.sin(t * 2 * Math.PI);
        } else if (waveform === 'square') {
          val = Math.sin(t * 2 * Math.PI) >= 0 ? 0.9 : -0.9;
        } else if (waveform === 'triangle') {
          val = (2 / Math.PI) * Math.asin(Math.sin(t * 2 * Math.PI));
        } else if (waveform === 'am') {
          const carrier = Math.sin(t * 2 * Math.PI * 4);
          const mod = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.5);
          val = carrier * mod;
        } else if (waveform === 'chirp') {
          val = Math.sin((t * t * 0.8) % (2 * Math.PI));
        }

        // Add transient ringing if underdamped
        if (dampingRatio < 0.8) {
          const ringDecay = Math.exp(-(x % 150) * 0.03 * dampingRatio);
          const ringOsc = Math.sin((x % 150) * 0.25);
          val += ringDecay * ringOsc * 0.35;
        }

        const y = centerY - val * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Input Reference Waveform V_in(t) in faint magenta
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.45)';
      ctx.lineWidth = 1.2;
      for (let x = 0; x < width; x++) {
        const t = (x / width) * (inputFreq * 0.015) + phase;
        const val = Math.sin(t * 2 * Math.PI);
        const y = centerY - val * (height * 0.25);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [viewMode, inputFreq, waveform, resistance, inductance, capacitance, bypassC, bypassL, qualityFactor, resonantFreq, dampingRatio]);

  // SDR Waterfall Spectrogram Loop
  useEffect(() => {
    if (viewMode !== 'sdr') return;
    const canvas = sdrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const width = canvas.width;
    const height = canvas.height;
    const spectrumHeight = 85;
    const waterfallHeight = height - spectrumHeight;

    // Color gradient map for SDR waterfall (GNU Radio / GQRX palette)
    const getColor = (power) => {
      const p = Math.max(0, Math.min(1, power));
      if (p < 0.2) return `rgb(${Math.floor(p * 50)}, ${Math.floor(p * 120)}, ${Math.floor(40 + p * 600)})`; // Navy -> Blue
      if (p < 0.45) return `rgb(0, ${Math.floor(100 + (p - 0.2) * 550)}, ${Math.floor(200 + (p - 0.2) * 200)})`; // Cyan
      if (p < 0.7) return `rgb(${Math.floor((p - 0.45) * 800)}, 255, ${Math.floor(120 - (p - 0.45) * 450)})`; // Chartreuse -> Yellow
      return `rgb(255, ${Math.floor(255 - (p - 0.7) * 750)}, ${Math.floor(50 - (p - 0.7) * 150)})`; // Amber -> Crimson
    };

    const render = () => {
      // 1. Generate synthesized FFT frequency bins across bandwidth
      const numBins = width;
      const currentFft = new Float32Array(numBins);
      const time = Date.now() * 0.003;

      for (let i = 0; i < numBins; i++) {
        // Base thermal noise floor
        let noise = (Math.random() - 0.5) * 0.12 + 0.18;
        
        // Target Signal Carrier in the middle
        const centerBin = Math.floor(numBins / 2);
        const distFromCenter = Math.abs(i - centerBin);
        
        // Main signal peak
        const carrierSignal = Math.exp(-Math.pow(distFromCenter / 12, 2)) * 0.78;

        // FSK / LoRa chirp or AM modulation sidebands
        const sideband1 = Math.exp(-Math.pow(Math.abs(distFromCenter - 38) / 6, 2)) * 0.45 * (0.5 + 0.5 * Math.sin(time * 3));
        const sideband2 = Math.exp(-Math.pow(Math.abs(distFromCenter + 38) / 6, 2)) * 0.45 * (0.5 + 0.5 * Math.cos(time * 3));

        // Periodic burst packet
        const burst = (Math.sin(time * 1.5) > 0.8) ? Math.exp(-Math.pow(distFromCenter / 22, 2)) * 0.35 : 0;

        currentFft[i] = Math.min(1.0, noise + carrierSignal + sideband1 + sideband2 + burst);
      }

      // Add to waterfall history buffer
      waterfallBufferRef.current.unshift(currentFft);
      if (waterfallBufferRef.current.length > waterfallHeight) {
        waterfallBufferRef.current.pop();
      }

      // Clear Canvas
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Draw Top: FFT Spectrum Line Graph
      ctx.fillStyle = 'rgba(3, 9, 20, 0.9)';
      ctx.fillRect(0, 0, width, spectrumHeight);

      // Spectrum Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 15; y < spectrumHeight; y += 22) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Spectrum curve
      ctx.beginPath();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      for (let i = 0; i < numBins; i++) {
        const val = currentFft[i];
        const y = spectrumHeight - val * (spectrumHeight - 8);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Center Tuning Reticle
      const cx = width / 2;
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Bandwidth Filter Passband box
      const bwPixels = (bandwidth / 1000) * (width * 0.4);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(cx - bwPixels / 2, 0, bwPixels, spectrumHeight);

      // Draw Bottom: Cascading Waterfall
      const buf = waterfallBufferRef.current;
      for (let row = 0; row < buf.length; row++) {
        const rowData = buf[row];
        const y = spectrumHeight + row;
        for (let x = 0; x < width; x += 2) {
          ctx.fillStyle = getColor(rowData[x]);
          ctx.fillRect(x, y, 2, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [viewMode, centerFreq, bandwidth, gainDb, noiseFloor]);

  // Audio Sonification using Web Audio API
  const toggleAudio = () => {
    if (isAudioPlaying) {
      if (oscNodeRef.current) {
        oscNodeRef.current.stop();
        oscNodeRef.current.disconnect();
      }
      setIsAudioPlaying(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = audioCtxRef.current || new AudioContext();
        audioCtxRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = waveform === 'square' ? 'square' : waveform === 'triangle' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(Math.min(2400, Math.max(60, inputFreq)), ctx.currentTime);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(Math.min(5000, Math.max(100, resonantFreq)), ctx.currentTime);
        filter.Q.setValueAtTime(Math.min(25, qualityFactor), ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscNodeRef.current = osc;
        filterNodeRef.current = filter;
        gainNodeRef.current = gain;
        setIsAudioPlaying(true);
      } catch (e) {
        console.warn('Web Audio error:', e);
      }
    }
  };

  // Update audio frequency on slider change
  useEffect(() => {
    if (isAudioPlaying && oscNodeRef.current && filterNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      oscNodeRef.current.frequency.setTargetAtTime(Math.min(2400, Math.max(60, inputFreq)), ctx.currentTime, 0.05);
      filterNodeRef.current.frequency.setTargetAtTime(Math.min(5000, Math.max(100, resonantFreq)), ctx.currentTime, 0.05);
      filterNodeRef.current.Q.setTargetAtTime(Math.min(25, qualityFactor), ctx.currentTime, 0.05);
    }
  }, [inputFreq, resonantFreq, qualityFactor, isAudioPlaying]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (oscNodeRef.current) {
        try { oscNodeRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="circ-sim-wrapper">
      {/* Top Header Bar */}
      <div className="circ-sim-header">
        <div className="circ-sim-title-group">
          <div className="circ-sim-badge">
            <FiCpu className="circ-badge-icon" />
            <span>ECE HARDWARE LAB // SIMULINK & GNU RADIO</span>
          </div>
          <h3 className="circ-sim-title">Interactive RLC Circuit & SDR Waterfall</h3>
        </div>

        <div className="circ-sim-actions">
          {/* Audio Sonification */}
          <button 
            className={`circ-audio-btn ${isAudioPlaying ? 'active' : ''}`}
            onClick={toggleAudio}
            title={isAudioPlaying ? "Mute live RF sonification" : "Listen to live synthesized audio tone"}
          >
            {isAudioPlaying ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
            <span>{isAudioPlaying ? 'AUDIO LIVE' : 'LISTEN RF'}</span>
          </button>

          {/* View Mode Switcher */}
          <div className="circ-view-pills">
            <button 
              className={`circ-view-pill ${viewMode === 'oscilloscope' ? 'active' : ''}`}
              onClick={() => setViewMode('oscilloscope')}
            >
              <FiActivity size={14} />
              <span>OSCILLOSCOPE V(t)</span>
            </button>
            <button 
              className={`circ-view-pill ${viewMode === 'sdr' ? 'active' : ''}`}
              onClick={() => setViewMode('sdr')}
            >
              <FiRadio size={14} />
              <span>SDR WATERFALL (FFT)</span>
            </button>
          </div>

          {onClose && (
            <button className="circ-close-btn" onClick={onClose} aria-label="Close circuit lab">✕</button>
          )}
        </div>
      </div>

      {/* Main Grid: Display Screen + Controls Panel */}
      <div className="circ-sim-grid">
        {/* Left Column: Screen Display */}
        <div className="circ-screen-container">
          <div className="circ-screen-chrome">
            <div className="circ-screen-tag">
              <span className="circ-screen-led" />
              {viewMode === 'oscilloscope' ? 'TEKTRONIX DIGITAL OSCILLOSCOPE // 2.5 GS/s' : 'GNU RADIO SDR SPECTROGRAM // 2.4 MSPS'}
            </div>
            <div className="circ-screen-readouts">
              <span>f₀ = {resonantFreq < 1000 ? `${resonantFreq.toFixed(1)} Hz` : `${(resonantFreq / 1000).toFixed(2)} kHz`}</span>
              <span>Q = {qualityFactor.toFixed(2)}</span>
              <span>|Z| = {totalImpedance.toFixed(1)} Ω</span>
            </div>
          </div>

          {viewMode === 'oscilloscope' ? (
            <canvas ref={oscCanvasRef} width={640} height={320} className="circ-canvas circ-canvas-osc" />
          ) : (
            <canvas ref={sdrCanvasRef} width={640} height={320} className="circ-canvas circ-canvas-sdr" />
          )}

          {/* Interactive Schematic Diagram */}
          <div className="circ-schematic-strip">
            <span className="circ-schematic-label">INTERACTIVE TOPOLOGY:</span>
            <div className="circ-schematic-items">
              <div className="circ-schem-component active">
                <span>AC GEN</span>
                <strong>{inputFreq} Hz</strong>
              </div>
              <div className="circ-schem-wire">───</div>
              <div className="circ-schem-component">
                <span>RESISTOR (R)</span>
                <strong>{resistance} Ω</strong>
              </div>
              <div className="circ-schem-wire">───</div>
              <button 
                className={`circ-schem-component btn-toggle ${bypassL ? 'bypassed' : 'active'}`}
                onClick={() => setBypassL(b => !b)}
                title="Click to bypass inductor"
              >
                <span>INDUCTOR (L)</span>
                <strong>{bypassL ? '[SHORTED]' : `${inductance} mH`}</strong>
              </button>
              <div className="circ-schem-wire">───</div>
              <button 
                className={`circ-schem-component btn-toggle ${bypassC ? 'bypassed' : 'active'}`}
                onClick={() => setBypassC(b => !b)}
                title="Click to bypass capacitor"
              >
                <span>CAPACITOR (C)</span>
                <strong>{bypassC ? '[SHORTED]' : `${capacitance} µF`}</strong>
              </button>
              <div className="circ-schem-wire">───</div>
              <div className="circ-schem-component ground">
                <span>GND</span>
                <strong>⏚</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Sliders & Presets */}
        <div className="circ-controls-panel">
          <div className="circ-panel-header">
            <FiSliders size={15} />
            <span>HARDWARE TUNING BENCH</span>
          </div>

          {/* Circuit Sliders */}
          <div className="circ-control-group">
            <div className="circ-slider-row">
              <label>
                <span>Resistance (R)</span>
                <strong>{resistance} Ω</strong>
              </label>
              <input 
                type="range" 
                min="5" 
                max="500" 
                value={resistance} 
                onChange={(e) => setResistance(Number(e.target.value))} 
              />
            </div>

            <div className="circ-slider-row">
              <label>
                <span>Inductance (L)</span>
                <strong>{inductance} mH</strong>
              </label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={inductance} 
                onChange={(e) => setInductance(Number(e.target.value))} 
              />
            </div>

            <div className="circ-slider-row">
              <label>
                <span>Capacitance (C)</span>
                <strong>{capacitance} µF</strong>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="20" 
                step="0.1" 
                value={capacitance} 
                onChange={(e) => setCapacitance(Number(e.target.value))} 
              />
            </div>

            <div className="circ-slider-row">
              <label>
                <span>Input Frequency (f_in)</span>
                <strong>{inputFreq} Hz</strong>
              </label>
              <input 
                type="range" 
                min="50" 
                max="2500" 
                step="10" 
                value={inputFreq} 
                onChange={(e) => setInputFreq(Number(e.target.value))} 
              />
            </div>
          </div>

          {/* Waveform Selector */}
          <div className="circ-waveform-selector">
            <span className="circ-sub-label">INPUT WAVEFORM:</span>
            <div className="circ-wave-buttons">
              {['sine', 'square', 'triangle', 'am', 'chirp'].map((w) => (
                <button 
                  key={w} 
                  className={`circ-wave-btn ${waveform === w ? 'active' : ''}`}
                  onClick={() => setWaveform(w)}
                >
                  {w.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SDR Parameters if in SDR mode */}
          {viewMode === 'sdr' && (
            <div className="circ-control-group sdr-subgroup">
              <div className="circ-slider-row">
                <label>
                  <span>Center Tuner (MHz)</span>
                  <strong>{centerFreq.toFixed(2)} MHz</strong>
                </label>
                <input 
                  type="range" 
                  min="88" 
                  max="915" 
                  step="0.1" 
                  value={centerFreq} 
                  onChange={(e) => setCenterFreq(Number(e.target.value))} 
                />
              </div>

              <div className="circ-slider-row">
                <label>
                  <span>RF Bandwidth (kHz)</span>
                  <strong>{bandwidth} kHz</strong>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="2000" 
                  step="25" 
                  value={bandwidth} 
                  onChange={(e) => setBandwidth(Number(e.target.value))} 
                />
              </div>
            </div>
          )}

          {/* Quick Engineering Presets */}
          <div className="circ-presets-container">
            <span className="circ-sub-label">HARDWARE PRESETS:</span>
            <div className="circ-presets-list">
              {PRESETS.map((p) => (
                <button 
                  key={p.name} 
                  className="circ-preset-card"
                  onClick={() => applyPreset(p)}
                >
                  <div className="circ-preset-top">
                    <span className="circ-preset-name">{p.name}</span>
                    <span className="circ-preset-cat">{p.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Damping Status Pill */}
          <div className="circ-telemetry-status">
            <div className="circ-status-item">
              <span>DAMPING REGIME:</span>
              <strong className={`circ-tag-${dampingClass.toLowerCase().replace(' ', '-')}`}>
                {dampingClass} (ζ = {dampingRatio.toFixed(3)})
              </strong>
            </div>
            <div className="circ-status-item">
              <span>PHASE SHIFT θ:</span>
              <strong>{phaseAngleDeg.toFixed(1)}°</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
