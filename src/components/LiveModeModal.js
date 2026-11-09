import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiMic, 
  FiMicOff, 
  FiVideo, 
  FiVideoOff, 
  FiX, 
  FiZap, 
  FiCpu,
  FiCornerDownLeft,
  FiCrosshair,
  FiEye,
  FiRefreshCw,
  FiPlay,
  FiActivity,
  FiShield
} from 'react-icons/fi';
import { liveSessionManager } from '../core/live/LiveSessionManager';
import { LIVE_SESSION_STATUS } from '../core/live/LiveSessionTypes';
import { VisualConversationBridge } from '../core/vision/VisualConversationBridge';
import { yoloObjectDetectionEngine } from '../core/vision/YoloObjectDetectionEngine';
import { providerRegistry } from '../core/providers/ProviderRegistry';
import { memoryService } from '../core/memory/MemoryService';
import './LiveModeModal.css';

// Sentinel initial state shown before any user gesture
const INITIAL_STATE = {
  status: LIVE_SESSION_STATUS.IDLE,
  sessionId: null,
  isMuted: false,
  micPermissionDenied: false,
  micHardwareUnavailable: false,
  micErrorMessage: null,
  transcript: [],
  interimUserText: '',
  interimAssistantText: '',
  visualizer: { volume: 0, frequencies: new Uint8Array(32) },
  isCameraActive: false,
};

export default function LiveModeModal({ isOpen, onClose }) {
  // ── Core state ──────────────────────────────────────────────────────
  const [sessionState, setSessionState] = useState(INITIAL_STATE);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [latestObservation, setLatestObservation] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [textInput, setTextInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const bridgeRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // ── Cleanup when modal closes ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      _teardown();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function _teardown() {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (liveSessionManager.status !== LIVE_SESSION_STATUS.IDLE) {
      liveSessionManager.endSession().catch(() => {});
    }
    if (bridgeRef.current) {
      bridgeRef.current.destroy();
      bridgeRef.current = null;
    }
    yoloObjectDetectionEngine.stop();
    setCameraActive(false);
    setLatestObservation(null);
    setSelectedTarget(null);
    setSessionStarted(false);
    setErrorMsg(null);
    setIsStarting(false);
    setSessionState(INITIAL_STATE);
  }

  // Keyboard: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // ── Scroll transcript to bottom ──────────────────────────────────────
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionState.transcript, sessionState.interimUserText, sessionState.interimAssistantText]);

  // ── Helper to ensure bridge exists ───────────────────────────────────
  const getOrCreateBridge = useCallback(() => {
    if (!bridgeRef.current) {
      const bridge = new VisualConversationBridge({ providerRegistry, memoryService });
      bridgeRef.current = bridge;
      liveSessionManager.attachVisualBridge(bridge);

      bridge.onObservation((obs) => {
        setLatestObservation(obs);
        if (obs && obs.objects) {
          yoloObjectDetectionEngine.updateDetections(obs.objects);
        }
      });
      bridge.onError((err) => console.warn('[VisualBridge error]', err));
    }
    return bridgeRef.current;
  }, []);

  // ── START SESSION (User-gesture gated to unlock AudioContext) ────────
  const handleStartSession = useCallback(async () => {
    if (isStarting || sessionStarted) return;
    setIsStarting(true);
    setErrorMsg(null);

    try {
      // 1. Initialize Visual Bridge
      getOrCreateBridge();

      // 2. Subscribe to state updates
      if (!unsubscribeRef.current) {
        unsubscribeRef.current = liveSessionManager.subscribe((snapshot) => {
          setSessionState(snapshot);
          if (snapshot.status === LIVE_SESSION_STATUS.ERROR && !snapshot.micPermissionDenied && !snapshot.micHardwareUnavailable) {
            setErrorMsg(snapshot.error || 'Live session encountered an error. Text mode is active.');
          }
        });
      }

      // 3. Start session — AudioContext is now safely initialized on user click
      await liveSessionManager.startSession();
      setSessionStarted(true);
    } catch (err) {
      console.warn('[LiveModeModal] Session start notice:', err);
      // Non-blocking fallback: permit interactive typing and vision even if audio context was blocked
      setSessionStarted(true);
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, sessionStarted, getOrCreateBridge]);

  // ── Camera Toggle ────────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    setErrorMsg(null);
    const bridge = getOrCreateBridge();

    if (cameraActive) {
      yoloObjectDetectionEngine.stop();
      bridge.stopCamera();
      setCameraActive(false);
      setLatestObservation(null);
      setSelectedTarget(null);
    } else {
      try {
        if (!sessionStarted) {
          await handleStartSession();
        }

        // Attach video element
        const videoEl = videoRef.current;
        await bridge.startCamera(videoEl, cameraFacing);
        setCameraActive(true);

        setTimeout(() => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.clientWidth || 640;
            canvasRef.current.height = videoRef.current.clientHeight || 480;
            yoloObjectDetectionEngine.attachElements(canvasRef.current, videoRef.current);
            yoloObjectDetectionEngine.start();
          }
        }, 350);
      } catch (err) {
        console.warn('[LiveModeModal] Camera start error:', err);
        setErrorMsg(err.message || 'Camera device could not be started. Check if another app is using it.');
      }
    }
  }, [cameraActive, cameraFacing, sessionStarted, handleStartSession, getOrCreateBridge]);

  const switchCameraFacing = useCallback(async () => {
    if (!bridgeRef.current || !cameraActive) return;
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    yoloObjectDetectionEngine.stop();
    bridgeRef.current.stopCamera();
    try {
      await bridgeRef.current.startCamera(videoRef.current, newFacing);
      setTimeout(() => {
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.clientWidth || 640;
          canvasRef.current.height = videoRef.current.clientHeight || 480;
          yoloObjectDetectionEngine.attachElements(canvasRef.current, videoRef.current);
          yoloObjectDetectionEngine.start();
        }
      }, 300);
    } catch (e) {
      console.warn(e);
      setErrorMsg(e.message || 'Could not flip camera.');
    }
  }, [cameraActive, cameraFacing]);

  const handleCanvasClick = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const target = yoloObjectDetectionEngine.selectTargetAt(x, y);
    setSelectedTarget(target);
    if (target) {
      liveSessionManager.submitSpokenTurn(`Explain the function and pins of this ${target.label}.`);
    }
  }, []);

  const handleInterrupt = useCallback(() => {
    liveSessionManager.handleInterruption();
  }, []);

  const handleToggleMic = useCallback(() => {
    if (!sessionStarted) {
      handleStartSession();
      return;
    }
    if (sessionState.micPermissionDenied || sessionState.micHardwareUnavailable) {
      liveSessionManager.requestMicrophoneRetry().then((ok) => {
        if (!ok) {
          setErrorMsg(sessionState.micErrorMessage || 'Microphone could not be accessed. Silent text mode remains active.');
        } else {
          setErrorMsg(null);
        }
      });
      return;
    }
    liveSessionManager.toggleMicrophone();
  }, [sessionStarted, sessionState.micPermissionDenied, sessionState.micHardwareUnavailable, sessionState.micErrorMessage, handleStartSession]);

  const handleManualTextSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    if (!sessionStarted) {
      await handleStartSession();
    }
    liveSessionManager.submitSpokenTurn(q);
  }, [textInput, sessionStarted, handleStartSession]);

  if (!isOpen) return null;

  const status = sessionState.status;
  const isSpeaking = status === LIVE_SESSION_STATUS.SPEAKING;
  const isConnecting = status === LIVE_SESSION_STATUS.CONNECTING || status === LIVE_SESSION_STATUS.REQUESTING_PERMISSION;

  const volume = sessionState.visualizer?.volume || 0;
  const ringScale = Math.min(1.45, Math.max(1.0, 1.0 + volume * 0.75));
  const frequencies = sessionState.visualizer?.frequencies || new Uint8Array(32);

  const statusLabel = (() => {
    if (!sessionStarted || status === LIVE_SESSION_STATUS.IDLE) return 'STANDBY';
    if (isStarting || isConnecting) return 'INITIALISING...';
    if (status === LIVE_SESSION_STATUS.SPEAKING) return 'SPEAKING';
    if (status === LIVE_SESSION_STATUS.LISTENING) {
      if (sessionState.userSpeaking) return 'HEARING YOU...';
      if (sessionState.isMuted) return 'MIC MUTED';
      if (sessionState.micPermissionDenied || sessionState.micHardwareUnavailable) return 'TEXT / VISION MODE';
      return 'LISTENING';
    }
    if (status === LIVE_SESSION_STATUS.PROCESSING) return 'SYNTHESISING...';
    if (status === LIVE_SESSION_STATUS.INTERRUPTED) return 'INTERRUPTED';
    if (status === LIVE_SESSION_STATUS.ERROR) return 'TEXT MODE';
    return status;
  })();

  const orbStatus = status === LIVE_SESSION_STATUS.ERROR ? 'listening' : status.toLowerCase();

  return (
    <div className="ma-live-overlay ma-live-theme-glassmorphic-light" role="dialog" aria-modal="true" aria-label="Mini-Adhy Live Cognition">
      {/* Ambient Prismatic Halo Lights */}
      <div className="ma-live-halo-primary" />
      <div className="ma-live-halo-secondary" />
      <div className="ma-live-halo-accent" />

      {/* Top Header HUD */}
      <div className="ma-live-header">
        <div className="ma-live-brand">
          <div className="ma-live-status-pill">
            <span className={`ma-live-status-dot ma-live-status-dot--${orbStatus}`} />
            <span className="ma-live-status-label">{statusLabel}</span>
          </div>
          <div className="ma-live-title-group">
            <span className="ma-live-title">MINI-ADHY LIVE COGNITION</span>
            <span className="ma-live-subtitle">ARC-REACTOR NEURAL CORE v2.5</span>
          </div>
        </div>

        <div className="ma-live-header-actions">
          <div className="ma-live-hud-metric">
            <FiActivity size={12} className="ma-live-hud-icon" />
            <span>0.8ms BUS</span>
          </div>

          {(sessionState.micPermissionDenied || sessionState.micHardwareUnavailable) && sessionStarted && (
            <button
              className="ma-live-btn-mic-retry"
              onClick={() => liveSessionManager.requestMicrophoneRetry()}
              title="Click to activate microphone stream"
            >
              <FiRefreshCw size={13} />
              <span>ENABLE MIC</span>
            </button>
          )}

          {cameraActive && (
            <button 
              className="ma-live-btn-sec"
              onClick={switchCameraFacing} 
              title="Flip camera lens"
            >
              <FiZap size={14} /> {cameraFacing === 'environment' ? 'REAR LENS' : 'FRONT LENS'}
            </button>
          )}

          <button 
            className="ma-live-close-btn"
            onClick={onClose}
            aria-label="Exit Live Mode"
            title="Exit Live Mode (Esc)"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Arena */}
      <div className="ma-live-body">
        {/* Visual Stream (YOLO Camera HUD) — Always in DOM to preserve refs */}
        <div className={`ma-live-camera-container ${cameraActive ? 'ma-live-camera-container--active' : 'ma-live-camera-container--hidden'}`}>
          <video ref={videoRef} className="ma-live-video" autoPlay playsInline muted />
          <canvas 
            ref={canvasRef} 
            className="ma-live-yolo-canvas" 
            onClick={handleCanvasClick}
            title="Tap any detected object for instant engineering inspection"
          />

          {cameraActive && (
            <div className="ma-live-vision-overlay">
              <div className="ma-live-vision-badge">
                <FiEye size={13} />
                <span>YOLO-V9 OBJECT RADAR: {latestObservation?.objects?.length || 0} ITEMS</span>
              </div>
              {selectedTarget && (
                <div className="ma-live-target-locked-pill">
                  <FiCrosshair size={12} />
                  <span>LOCKED: {selectedTarget.label.toUpperCase()}</span>
                </div>
              )}
              {latestObservation?.objects && latestObservation.objects.length > 0 && (
                <div className="ma-live-detected-chips">
                  {latestObservation.objects.slice(0, 6).map((obj) => (
                    <span 
                      key={obj.id} 
                      className={`ma-live-obj-chip ${selectedTarget?.id === obj.id ? 'ma-live-obj-chip--selected' : ''}`}
                      onClick={() => {
                        setSelectedTarget(obj);
                        liveSessionManager.submitSpokenTurn(`Explain the function and pinout of this ${obj.label}.`);
                      }}
                    >
                      {obj.label}
                    </span>
                  ))}
                </div>
              )}
              {latestObservation?.ocrTexts && latestObservation.ocrTexts.length > 0 && (
                <div className="ma-live-ocr-strip">
                  <span className="ma-live-ocr-label">SILKSCREEN OCR:</span>
                  <span className="ma-live-ocr-text">
                    {latestObservation.ocrTexts.map(t => t.text).join(' • ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Central Quantum Arc-Reactor Holographic Orb */}
        <div className={`ma-live-visualizer-wrap ${cameraActive ? 'ma-live-visualizer-wrap--compact' : ''}`}>
          {!sessionStarted ? (
            /* ── PRE-START SPLASH ── */
            <div className="ma-live-presession">
              {/* Quantum Arc Reactor Core (Pre-Session) */}
              <div className="ma-stark-orb-assembly">
                <div className="ma-stark-reticle-outer" />
                <div className="ma-stark-reticle-inner" />
                <div className="ma-stark-energy-corona" />
                <div className="ma-stark-reactor-core">
                  <div className="ma-stark-core-plasma" />
                  <div className="ma-stark-core-flare" />
                </div>
              </div>

              <p className="ma-live-presession-label">Mini-Adhy Sovereign Cognition</p>
              <p className="ma-live-presession-hint">Bilingual Spoken Voice · YOLO-V9 Visual Intelligence · Zero Latency</p>
              
              <button
                className="ma-live-start-btn"
                onClick={handleStartSession}
                disabled={isStarting}
                title="Initialize sovereign cognitive session"
              >
                {isStarting ? (
                  <><span className="ma-live-start-spinner" /> Initialising Core...</>
                ) : (
                  <><FiPlay size={16} /> Engage Mini-Adhy</>
                )}
              </button>
            </div>
          ) : (
            /* ── ACTIVE ARC-REACTOR HOLOGRAPHIC ORB ── */
            <div className="ma-live-active-orb-area">
              <div 
                className={`ma-stark-orb-assembly ma-stark-orb-assembly--${orbStatus}`}
                style={{ transform: `scale(${ringScale})` }}
              >
                {/* Outer Reticle Ring with Precision Tick Marks */}
                <div className="ma-stark-reticle-outer" />
                
                {/* Counter-Rotating Gyroscopic Ring */}
                <div className="ma-stark-reticle-inner" />
                
                {/* Pulsating Quantum Wave Corona */}
                <div className="ma-stark-energy-corona" />
                
                {/* Arc Reactor Core with Pure Cyan Plasma */}
                <div className="ma-stark-reactor-core">
                  <div className="ma-stark-core-plasma" />
                  <div className="ma-stark-core-flare" />
                  <div className="ma-stark-core-rings" />
                </div>

                {/* State Glow Rings */}
                <div className={`ma-stark-pulse-aura ma-stark-pulse-aura--${orbStatus}`} />
              </div>

              {/* Circular Harmonic Waveform Pillars */}
              <div className="ma-live-bars-wrap">
                {Array.from(frequencies.slice(0, 24)).map((val, idx) => (
                  <div 
                    key={idx} 
                    className="ma-live-fft-bar" 
                    style={{ 
                      height: `${Math.max(6, Math.min(48, (val / 255) * 48))}px`,
                      opacity: Math.max(0.35, val / 255)
                    }} 
                  />
                ))}
              </div>

              {isSpeaking && (
                <button 
                  className="ma-live-interrupt-pill"
                  onClick={handleInterrupt}
                  title="Interrupt Mini-Adhy speech"
                >
                  <span>Tap to Interrupt</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Conversation Subtitles & Transcript */}
        <div className="ma-live-transcript-container">
          <div className="ma-live-transcript-scroll">
            {sessionState.transcript.length === 0 && (
              <div className="ma-live-empty-state">
                <FiCpu className="ma-live-empty-icon" size={24} />
                <p>Mini-Adhy is listening with sovereign intelligence.</p>
                <span>
                  {sessionStarted
                    ? (sessionState.micPermissionDenied || sessionState.micHardwareUnavailable
                        ? 'Microphone stream is in silent text mode. Type questions below or enable camera for YOLO-V9 object inspection.'
                        : 'Speak naturally into your microphone or type questions below. Enable camera for real-time circuit inspection.')
                    : 'Click "Engage Mini-Adhy" above or type a query below to start.'}
                </span>
              </div>
            )}

            {sessionState.transcript.map((msg, index) => (
              <div key={index} className={`ma-live-turn ma-live-turn--${msg.role.toLowerCase()}`}>
                <div className="ma-live-turn-header">
                  <span className="ma-live-turn-speaker">
                    {msg.role === 'USER' ? 'YOU' : 'MINI-ADHY'}
                  </span>
                  {msg.latencyMs && (
                    <span className="ma-live-turn-latency">{msg.latencyMs}ms</span>
                  )}
                </div>
                <p className="ma-live-turn-text">{msg.text}</p>
              </div>
            ))}

            {sessionState.interimUserText && (
              <div className="ma-live-turn ma-live-turn--user ma-live-turn--interim">
                <span className="ma-live-turn-speaker">YOU (SPEAKING...)</span>
                <p className="ma-live-turn-text">{sessionState.interimUserText}</p>
              </div>
            )}

            {sessionState.interimAssistantText && (
              <div className="ma-live-turn ma-live-turn--assistant ma-live-turn--interim">
                <span className="ma-live-turn-speaker">MINI-ADHY (GENERATING...)</span>
                <p className="ma-live-turn-text">{sessionState.interimAssistantText}</p>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Advisory Banner (Glassmorphic, unobtrusive, dismissable) */}
      {errorMsg && (
        <div className="ma-live-error-banner">
          <div className="ma-live-banner-content">
            <FiShield size={14} className="ma-live-banner-icon" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>Dismiss</button>
        </div>
      )}

      {/* Bottom Floating Cyber Controls Deck */}
      <div className="ma-live-footer">
        {/* Text Input Form */}
        <form className="ma-live-text-input-form" onSubmit={handleManualTextSubmit}>
          <input
            type="text"
            className="ma-live-input-field"
            placeholder={
              !sessionStarted
                ? 'Type a question to engage Mini-Adhy...'
                : (sessionState.isMuted || sessionState.micPermissionDenied || sessionState.micHardwareUnavailable
                    ? 'Type a question or command for Mini-Adhy...'
                    : 'Type or speak a question...')
            }
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button type="submit" className="ma-live-send-btn" title="Send question">
            <FiCornerDownLeft size={16} />
          </button>
        </form>

        {/* Action Controls Cluster */}
        <div className="ma-live-controls-cluster">
          {/* Mic Button */}
          <button
            type="button"
            className={`ma-live-action-btn ${
              !sessionStarted || sessionState.isMuted || sessionState.micPermissionDenied || sessionState.micHardwareUnavailable
                ? 'ma-live-action-btn--muted'
                : 'ma-live-action-btn--active'
            }`}
            onClick={handleToggleMic}
            title={
              !sessionStarted ? 'Engage Session'
                : (sessionState.micPermissionDenied || sessionState.micHardwareUnavailable) ? 'Attempt microphone reconnect'
                  : sessionState.isMuted ? 'Unmute microphone'
                    : 'Mute microphone'
            }
          >
            {sessionState.isMuted || sessionState.micPermissionDenied || sessionState.micHardwareUnavailable || !sessionStarted
              ? <FiMicOff size={19} />
              : <FiMic size={19} />}
            <span>
              {!sessionStarted ? 'START'
                : (sessionState.micPermissionDenied || sessionState.micHardwareUnavailable) ? 'MIC SILENT'
                  : sessionState.isMuted ? 'UNMUTE' : 'MUTE'}
            </span>
          </button>

          {/* Camera Button */}
          <button
            type="button"
            className={`ma-live-action-btn ${cameraActive ? 'ma-live-action-btn--active' : ''}`}
            onClick={toggleCamera}
            title={cameraActive ? 'Turn Camera Off' : 'Engage YOLO-V9 Visual Intelligence'}
          >
            {cameraActive ? <FiVideo size={19} /> : <FiVideoOff size={19} />}
            <span>{cameraActive ? 'YOLO RADAR ON' : 'CAMERA OFF'}</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            className="ma-live-action-btn ma-live-action-btn--end"
            onClick={onClose}
            title="Terminate Live Session"
          >
            <FiX size={19} />
            <span>END CALL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
