import React, { useState, useEffect, useRef } from 'react';
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
  FiRefreshCw
} from 'react-icons/fi';
import { liveSessionManager } from '../core/live/LiveSessionManager';
import { LIVE_SESSION_STATUS } from '../core/live/LiveSessionTypes';
import { VisualConversationBridge } from '../core/vision/VisualConversationBridge';
import { yoloObjectDetectionEngine } from '../core/vision/YoloObjectDetectionEngine';
import { providerRegistry } from '../core/providers/ProviderRegistry';
import { memoryService } from '../core/memory/MemoryService';
import './LiveModeModal.css';

export default function LiveModeModal({ isOpen, onClose }) {
  const [sessionState, setSessionState] = useState(liveSessionManager.getStateSnapshot());
  const [cameraActive, setCameraActive] = useState(false);
  const [latestObservation, setLatestObservation] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [textInput, setTextInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const bridgeRef = useRef(null);

  // Initialize and subscribe to LiveSessionManager
  useEffect(() => {
    if (!isOpen) {
      if (liveSessionManager.status !== LIVE_SESSION_STATUS.IDLE) {
        liveSessionManager.endSession();
      }
      if (bridgeRef.current) {
        bridgeRef.current.destroy();
        bridgeRef.current = null;
      }
      yoloObjectDetectionEngine.stop();
      setCameraActive(false);
      setLatestObservation(null);
      setSelectedTarget(null);
      return;
    }

    // 1. Initialize Visual Conversation Bridge
    const bridge = new VisualConversationBridge({
      providerRegistry,
      memoryService
    });
    bridgeRef.current = bridge;
    liveSessionManager.attachVisualBridge(bridge);

    bridge.onObservation((obs) => {
      setLatestObservation(obs);
      if (obs && obs.objects) {
        yoloObjectDetectionEngine.updateDetections(obs.objects);
      }
    });

    bridge.onError((err) => {
      console.warn('[VisualBridge error]', err);
    });

    // 2. Subscribe to LiveSessionManager state
    const unsubscribe = liveSessionManager.subscribe((snapshot) => {
      setSessionState(snapshot);
      if (snapshot.status === LIVE_SESSION_STATUS.ERROR) {
        setErrorMsg(snapshot.error || 'Live session encountered an error.');
      }
    });

    // 3. Start live voice session (handles mic gracefully without failing the whole session)
    liveSessionManager.startSession().catch((err) => {
      console.warn('[LiveModeModal] Voice session notice:', err);
    });

    return () => {
      unsubscribe();
      liveSessionManager.endSession().catch(() => {});
      yoloObjectDetectionEngine.stop();
      if (bridgeRef.current) {
        bridgeRef.current.destroy();
        bridgeRef.current = null;
      }
    };
  }, [isOpen]);

  // Scroll transcript to bottom on new items
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionState.transcript, sessionState.interimUserText, sessionState.interimAssistantText]);

  // Handle Camera Toggle & YOLO Canvas initialization
  const toggleCamera = async () => {
    if (!bridgeRef.current) return;

    if (cameraActive) {
      yoloObjectDetectionEngine.stop();
      bridgeRef.current.stopCamera();
      setCameraActive(false);
      setLatestObservation(null);
      setSelectedTarget(null);
    } else {
      try {
        setErrorMsg(null);
        await bridgeRef.current.startCamera(videoRef.current, cameraFacing);
        setCameraActive(true);

        // Attach YOLO Object Detection overlay
        setTimeout(() => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.clientWidth || 640;
            canvasRef.current.height = videoRef.current.clientHeight || 480;
            yoloObjectDetectionEngine.attachElements(canvasRef.current, videoRef.current);
            yoloObjectDetectionEngine.start();
          }
        }, 300);
      } catch (err) {
        setErrorMsg('Camera access was not granted or camera device is unavailable.');
      }
    }
  };

  const switchCameraFacing = async () => {
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
    }
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const target = yoloObjectDetectionEngine.selectTargetAt(x, y);
    setSelectedTarget(target);
    if (target) {
      liveSessionManager.submitSpokenTurn(`What is this ${target.label} and how does it work?`);
    }
  };

  const handleInterrupt = () => {
    liveSessionManager.handleInterruption();
  };

  const handleToggleMic = () => {
    if (sessionState.micPermissionDenied) {
      liveSessionManager.requestMicrophoneRetry().then((ok) => {
        if (!ok) {
          setErrorMsg('Microphone permission is blocked in browser settings. Please enable it in browser URL bar.');
        } else {
          setErrorMsg(null);
        }
      });
      return;
    }
    liveSessionManager.toggleMicrophone();
  };

  const handleManualTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    liveSessionManager.submitSpokenTurn(q);
  };

  if (!isOpen) return null;

  const status = sessionState.status;
  const isSpeaking = status === LIVE_SESSION_STATUS.SPEAKING;

  // Compute visualizer ring scale from audio volume
  const volume = sessionState.visualizer?.volume || 0;
  const ringScale = Math.min(1.7, Math.max(1.0, 1.0 + volume * 0.85));
  const frequencies = sessionState.visualizer?.frequencies || new Uint8Array(32);

  return (
    <div className="ma-live-overlay ma-live-theme-glassmorphic-light" role="dialog" aria-modal="true" aria-label="Mini-Adhy Live Cognition">
      {/* Frosted Ambient Halo Lights */}
      <div className="ma-live-halo-primary" />
      <div className="ma-live-halo-secondary" />

      {/* Top Header */}
      <div className="ma-live-header">
        <div className="ma-live-brand">
          <div className="ma-live-status-pill">
            <span className={`ma-live-status-dot ma-live-status-dot--${status.toLowerCase()}`} />
            <span className="ma-live-status-label">
              {status === LIVE_SESSION_STATUS.SPEAKING && 'SPEAKING'}
              {status === LIVE_SESSION_STATUS.LISTENING && (
                sessionState.userSpeaking ? 'HEARING YOU...' : (sessionState.isMuted || sessionState.micPermissionDenied ? 'SILENT / TEXT & VISION MODE' : 'LISTENING')
              )}
              {status === LIVE_SESSION_STATUS.PROCESSING && 'SYNTHESIZING...'}
              {status === LIVE_SESSION_STATUS.INTERRUPTED && 'INTERRUPTED'}
              {status === LIVE_SESSION_STATUS.REQUESTING_PERMISSION && 'REQUESTING MIC...'}
              {status === LIVE_SESSION_STATUS.CONNECTING && 'CONNECTING...'}
              {status === LIVE_SESSION_STATUS.IDLE && 'STANDBY'}
              {status === LIVE_SESSION_STATUS.ERROR && 'COGNITION ERROR'}
            </span>
          </div>
          <span className="ma-live-title">MINI-ADHY LIVE COGNITION</span>
        </div>

        <div className="ma-live-header-actions">
          {sessionState.micPermissionDenied && (
            <button
              className="ma-live-btn-mic-retry"
              onClick={() => liveSessionManager.requestMicrophoneRetry()}
              title="Click to request microphone permission"
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

      {/* Mic Permission Guidance Banner (Only if blocked) */}
      {sessionState.micPermissionDenied && (
        <div className="ma-live-permission-tip">
          <div className="ma-live-tip-content">
            <span className="ma-live-tip-icon">🎙️</span>
            <div>
              <strong>Microphone is in silent mode.</strong> You can speak by typing questions below, inspect circuits with the live YOLO camera, and listen to Mini-Adhy's voice.
            </div>
          </div>
          <button 
            className="ma-live-tip-action"
            onClick={() => liveSessionManager.requestMicrophoneRetry()}
          >
            Grant Mic Access
          </button>
        </div>
      )}

      {/* Main Content Arena */}
      <div className="ma-live-body">
        {/* Visual Stream (YOLO Camera HUD) */}
        {cameraActive && (
          <div className="ma-live-camera-container">
            <video 
              ref={videoRef} 
              className="ma-live-video" 
              autoPlay 
              playsInline 
              muted 
            />
            {/* Real-time YOLO Canvas Overlay */}
            <canvas 
              ref={canvasRef} 
              className="ma-live-yolo-canvas" 
              onClick={handleCanvasClick}
              title="Tap any detected object for instant deep engineering inspection"
            />

            {/* Visual Intelligence HUD Badge */}
            <div className="ma-live-vision-overlay">
              <div className="ma-live-vision-badge">
                <FiEye size={13} />
                <span>YOLO-V9 OBJECT RADAR: {latestObservation?.objects?.length || 0} ITEMS</span>
              </div>

              {selectedTarget && (
                <div className="ma-live-target-locked-pill">
                  <FiCrosshair size={12} />
                  <span>LOCKED ON: {selectedTarget.label.toUpperCase()}</span>
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
                        liveSessionManager.submitSpokenTurn(`Explain the function and pins of this ${obj.label}.`);
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
          </div>
        )}

        {/* Central Audio Visualizer Ring (Luxurious Glass Orb) */}
        <div className="ma-live-visualizer-wrap">
          <div 
            className={`ma-live-orb ma-live-orb--${status.toLowerCase()}`}
            style={{ transform: `scale(${ringScale})` }}
          >
            <div className="ma-live-orb-core" />
            <div className="ma-live-orb-shimmer" />
            <div className="ma-live-orb-pulse" />
          </div>

          {/* Equalizer Waveform Bars (Glassmorphic Opal Pillars) */}
          <div className="ma-live-bars-wrap">
            {Array.from(frequencies.slice(0, 24)).map((val, idx) => (
              <div 
                key={idx} 
                className="ma-live-fft-bar" 
                style={{ 
                  height: `${Math.max(6, Math.min(56, (val / 255) * 56))}px`,
                  opacity: Math.max(0.4, val / 255)
                }} 
              />
            ))}
          </div>

          {isSpeaking && (
            <button 
              className="ma-live-interrupt-pill"
              onClick={handleInterrupt}
              title="Click or speak to interrupt immediately"
            >
              <span>Tap to Interrupt</span>
            </button>
          )}
        </div>

        {/* Live Conversation Subtitles & Transcript */}
        <div className="ma-live-transcript-container">
          <div className="ma-live-transcript-scroll">
            {sessionState.transcript.length === 0 && (
              <div className="ma-live-empty-state">
                <FiCpu className="ma-live-empty-icon" size={24} />
                <p>Mini-Adhy is listening with sovereign intelligence.</p>
                <span>Speak naturally or type questions below. Enable camera for real-time YOLO object & PCB inspection.</span>
              </div>
            )}

            {sessionState.transcript.map((msg, index) => (
              <div 
                key={index} 
                className={`ma-live-turn ma-live-turn--${msg.role.toLowerCase()}`}
              >
                <span className="ma-live-turn-speaker">
                  {msg.role === 'USER' ? 'YOU' : 'MINI-ADHY'}
                </span>
                <p className="ma-live-turn-text">{msg.text}</p>
              </div>
            ))}

            {/* Interim Real-Time Utterance */}
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

      {/* Error Banner */}
      {errorMsg && (
        <div className="ma-live-error-banner">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>Dismiss</button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="ma-live-footer">
        {/* Hybrid Spoken/Text Input */}
        <form className="ma-live-text-input-form" onSubmit={handleManualTextSubmit}>
          <input
            type="text"
            className="ma-live-input-field"
            placeholder={sessionState.isMuted || sessionState.micPermissionDenied ? "Type a question or query for Mini-Adhy..." : "Type or speak a question..."}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button type="submit" className="ma-live-send-btn" title="Send spoken turn">
            <FiCornerDownLeft size={16} />
          </button>
        </form>

        <div className="ma-live-controls-cluster">
          {/* Mute/Unmute Mic */}
          <button
            type="button"
            className={`ma-live-action-btn ${sessionState.isMuted || sessionState.micPermissionDenied ? 'ma-live-action-btn--muted' : 'ma-live-action-btn--active'}`}
            onClick={handleToggleMic}
            title={sessionState.micPermissionDenied ? 'Grant microphone permission' : (sessionState.isMuted ? 'Unmute microphone' : 'Mute microphone')}
          >
            {sessionState.isMuted || sessionState.micPermissionDenied ? <FiMicOff size={19} /> : <FiMic size={19} />}
            <span>{sessionState.micPermissionDenied ? 'ENABLE MIC' : (sessionState.isMuted ? 'UNMUTE' : 'MUTE')}</span>
          </button>

          {/* Camera On/Off */}
          <button
            type="button"
            className={`ma-live-action-btn ${cameraActive ? 'ma-live-action-btn--active' : ''}`}
            onClick={toggleCamera}
            title={cameraActive ? 'Disable Camera' : 'Enable Camera for YOLO Object & Circuit Perception'}
          >
            {cameraActive ? <FiVideo size={19} /> : <FiVideoOff size={19} />}
            <span>{cameraActive ? 'YOLO VISION ON' : 'CAMERA OFF'}</span>
          </button>

          {/* End Call / Leave Live Mode */}
          <button
            type="button"
            className="ma-live-action-btn ma-live-action-btn--end"
            onClick={onClose}
            title="End Live Conversation"
          >
            <FiX size={19} />
            <span>END CALL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
