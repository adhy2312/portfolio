import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMic, 
  FiMicOff, 
  FiVideo, 
  FiVideoOff, 
  FiX, 
  FiZap, 
  FiCpu,
  FiCornerDownLeft
} from 'react-icons/fi';
import { liveSessionManager } from '../core/live/LiveSessionManager';
import { LIVE_SESSION_STATUS } from '../core/live/LiveSessionTypes';
import { VisualConversationBridge } from '../core/vision/VisualConversationBridge';
import { providerRegistry } from '../core/providers/ProviderRegistry';
import { memoryService } from '../core/memory/MemoryService';
import './LiveModeModal.css';

export default function LiveModeModal({ isOpen, onClose }) {
  const [sessionState, setSessionState] = useState(liveSessionManager.getStateSnapshot());
  const [cameraActive, setCameraActive] = useState(false);
  const [latestObservation, setLatestObservation] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [textInput, setTextInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const videoRef = useRef(null);
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
      setCameraActive(false);
      setLatestObservation(null);
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

    // 3. Start live voice session
    liveSessionManager.startSession().catch((err) => {
      setErrorMsg(err.message || 'Failed to start microphone or speech engine.');
    });

    return () => {
      unsubscribe();
      liveSessionManager.endSession().catch(() => {});
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

  // Handle Camera Toggle
  const toggleCamera = async () => {
    if (!bridgeRef.current) return;

    if (cameraActive) {
      bridgeRef.current.stopCamera();
      setCameraActive(false);
      setLatestObservation(null);
    } else {
      try {
        setErrorMsg(null);
        await bridgeRef.current.startCamera(videoRef.current, cameraFacing);
        setCameraActive(true);
      } catch (err) {
        setErrorMsg('Camera permission denied or camera device unavailable.');
      }
    }
  };

  const switchCameraFacing = async () => {
    if (!bridgeRef.current || !cameraActive) return;
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    bridgeRef.current.stopCamera();
    try {
      await bridgeRef.current.startCamera(videoRef.current, newFacing);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleInterrupt = () => {
    liveSessionManager.handleInterruption();
  };

  const handleToggleMic = () => {
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
  const ringScale = Math.min(1.8, Math.max(1.0, 1.0 + volume * 0.9));
  const frequencies = sessionState.visualizer?.frequencies || new Uint8Array(32);

  return (
    <div className="ma-live-overlay" role="dialog" aria-modal="true" aria-label="Mini-Adhy Live Mode">
      {/* Top Header */}
      <div className="ma-live-header">
        <div className="ma-live-brand">
          <div className="ma-live-status-pill">
            <span className={`ma-live-status-dot ma-live-status-dot--${status.toLowerCase()}`} />
            <span className="ma-live-status-label">
              {status === LIVE_SESSION_STATUS.SPEAKING && 'SPEAKING'}
              {status === LIVE_SESSION_STATUS.LISTENING && (sessionState.userSpeaking ? 'HEARING YOU...' : 'LISTENING')}
              {status === LIVE_SESSION_STATUS.PROCESSING && 'THINKING...'}
              {status === LIVE_SESSION_STATUS.INTERRUPTED && 'INTERRUPTED'}
              {status === LIVE_SESSION_STATUS.REQUESTING_PERMISSION && 'REQUESTING MIC...'}
              {status === LIVE_SESSION_STATUS.CONNECTING && 'CONNECTING...'}
              {status === LIVE_SESSION_STATUS.IDLE && 'STANDBY'}
              {status === LIVE_SESSION_STATUS.ERROR && 'ERROR'}
            </span>
          </div>
          <span className="ma-live-title">MINI-ADHY LIVE COGNITION</span>
        </div>

        <div className="ma-live-header-actions">
          {cameraActive && (
            <button 
              className="ma-live-btn-sec"
              onClick={switchCameraFacing} 
              title="Flip camera lens"
            >
              <FiZap size={14} /> {cameraFacing === 'environment' ? 'REAR' : 'FRONT'}
            </button>
          )}

          <button 
            className="ma-live-close-btn"
            onClick={onClose}
            aria-label="Exit Live Mode"
            title="Exit Live Mode (Esc)"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Arena */}
      <div className="ma-live-body">
        {/* Visual Stream (Camera PiP or full preview) */}
        {cameraActive && (
          <div className="ma-live-camera-container">
            <video 
              ref={videoRef} 
              className="ma-live-video" 
              autoPlay 
              playsInline 
              muted 
            />
            {/* Visual Intelligence Overlay */}
            {latestObservation && (
              <div className="ma-live-vision-overlay">
                <div className="ma-live-vision-badge">
                  <FiCpu size={12} />
                  <span>{latestObservation.objects?.length || 0} ITEMS DETECTED</span>
                </div>

                {latestObservation.objects && latestObservation.objects.length > 0 && (
                  <div className="ma-live-detected-chips">
                    {latestObservation.objects.slice(0, 5).map((obj) => (
                      <span key={obj.id} className="ma-live-obj-chip">
                        {obj.label}
                      </span>
                    ))}
                  </div>
                )}

                {latestObservation.ocrTexts && latestObservation.ocrTexts.length > 0 && (
                  <div className="ma-live-ocr-strip">
                    <span className="ma-live-ocr-label">OCR:</span>
                    <span className="ma-live-ocr-text">
                      {latestObservation.ocrTexts.map(t => t.text).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Central Audio Visualizer Ring */}
        <div className="ma-live-visualizer-wrap">
          <div 
            className={`ma-live-orb ma-live-orb--${status.toLowerCase()}`}
            style={{ transform: `scale(${ringScale})` }}
          >
            <div className="ma-live-orb-inner" />
            <div className="ma-live-orb-pulse" />
          </div>

          {/* Equalizer Waveform Bars */}
          <div className="ma-live-bars-wrap">
            {Array.from(frequencies.slice(0, 24)).map((val, idx) => (
              <div 
                key={idx} 
                className="ma-live-fft-bar" 
                style={{ 
                  height: `${Math.max(6, Math.min(64, (val / 255) * 64))}px`,
                  opacity: Math.max(0.3, val / 255)
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
            placeholder="Type or speak a question..."
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
            className={`ma-live-action-btn ${sessionState.isMuted ? 'ma-live-action-btn--muted' : 'ma-live-action-btn--active'}`}
            onClick={handleToggleMic}
            title={sessionState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {sessionState.isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
            <span>{sessionState.isMuted ? 'UNMUTE' : 'MUTE'}</span>
          </button>

          {/* Camera On/Off */}
          <button
            type="button"
            className={`ma-live-action-btn ${cameraActive ? 'ma-live-action-btn--active' : ''}`}
            onClick={toggleCamera}
            title={cameraActive ? 'Disable Camera' : 'Enable Camera for Object/Circuit Perception'}
          >
            {cameraActive ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
            <span>{cameraActive ? 'CAMERA ON' : 'CAMERA OFF'}</span>
          </button>

          {/* End Call / Leave Live Mode */}
          <button
            type="button"
            className="ma-live-action-btn ma-live-action-btn--end"
            onClick={onClose}
            title="End Live Conversation"
          >
            <FiX size={20} />
            <span>END CALL</span>
          </button>
        </div>
      </div>
    </div>
  );
}

