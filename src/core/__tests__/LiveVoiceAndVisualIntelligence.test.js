/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY — PHASE 10 & 10B: LIVE VOICE & VISUAL INTELLIGENCE TESTS
 * ════════════════════════════════════════════════════════════════════
 * Unit and integration tests verifying real-time spoken conversational
 * capabilities, instant barge-in interruptions, Web Audio lifecycle,
 * and multimodal visual perception & spatial intelligence.
 */

// Mock Sanity for Jest testing environment
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { LiveSessionManager } from '../live/LiveSessionManager';
import { LIVE_SESSION_STATUS } from '../live/LiveSessionTypes';
import { VoiceActivityDetector } from '../live/VoiceActivityDetector';
import { AudioOutputManager } from '../live/AudioOutputManager';
import { AudioInputManager } from '../live/AudioInputManager';
import { LiveTranscriptManager } from '../live/LiveTranscriptManager';
import { LiveConversationContext } from '../live/LiveConversationContext';
import { VisualInputManager } from '../vision/VisualInputManager';
import { VisualPerceptionEngine } from '../vision/VisualPerceptionEngine';
import { VisualIntelligenceEngine } from '../vision/VisualIntelligenceEngine';
import { VisualSessionMemory } from '../vision/VisualSessionMemory';
import { VisualContextCompiler } from '../vision/VisualContextCompiler';
import { VisualConversationBridge } from '../vision/VisualConversationBridge';
import { VISUAL_INPUT_MODE, OBJECT_CATEGORY, SPATIAL_RELATIONSHIP_TYPE } from '../vision/VisualTypes';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';

describe('MINI-ADHY PHASE 10: Live Voice & Real-Time Spoken Conversation', () => {
  let mockAudioEngine;

  beforeEach(() => {
    // Mock Web Audio Engine
    mockAudioEngine = {
      ensureAudioContext: jest.fn().mockResolvedValue({
        state: 'running',
        createAnalyser: () => ({
          fftSize: 64,
          frequencyBinCount: 32,
          getByteFrequencyData: jest.fn(),
          getByteTimeDomainData: jest.fn(),
          connect: jest.fn()
        }),
        createGain: () => ({
          gain: { value: 1, setValueAtTime: jest.fn() },
          connect: jest.fn()
        }),
        createMediaStreamSource: jest.fn().mockReturnValue({
          connect: jest.fn(),
          disconnect: jest.fn()
        }),
        createScriptProcessor: jest.fn().mockReturnValue({
          connect: jest.fn(),
          disconnect: jest.fn()
        }),
        destination: {}
      }),
      inputAnalyser: {},
      outputAnalyser: {},
      getVisualizerData: jest.fn().mockReturnValue({ volume: 0.2, frequencies: new Uint8Array(32).fill(100) }),
      close: jest.fn().mockResolvedValue(true)
    };

    // Global Web APIs mocks
    global.window = global.window || {};
    global.window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn().mockReturnValue([])
    };
    global.SpeechSynthesisUtterance = function (text) {
      this.text = text;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Voice Activity Detector (VAD) & Barge-In Cutoff', () => {
    test('calculates RMS energy and triggers speech start / end callbacks', () => {
      const onSpeechStart = jest.fn();
      const onSpeechEnd = jest.fn();
      const onInterruption = jest.fn();

      const vad = new VoiceActivityDetector({
        speechThresholdRms: 0.05,
        hangoverFrames: 2,
        onSpeechStart,
        onSpeechEnd,
        onInterruption
      });

      // 1. Send silent frames (all zeros)
      const silentFrame = new Float32Array(128).fill(0.001);
      vad.processAudioFrame(silentFrame);
      expect(onSpeechStart).not.toHaveBeenCalled();

      // 2. Send loud speech frames (above threshold)
      const speechFrame = new Float32Array(128).fill(0.15);
      vad.processAudioFrame(speechFrame);
      expect(onSpeechStart).toHaveBeenCalled();

      // 3. Assistant is speaking -> User speech causes INSTANT barge-in interruption!
      vad.setAssistantSpeaking(true);
      vad.processAudioFrame(speechFrame);
      expect(onInterruption).toHaveBeenCalled();
    });
  });

  describe('2. Audio Input and Output Managers', () => {
    test('AudioOutputManager queues speech, handles interruptions, and cleans up', () => {
      const onInterrupted = jest.fn();
      const outputManager = new AudioOutputManager({ onInterrupted });

      outputManager.speakUtterance('Hello creator, live speech is active.');
      expect(outputManager.isSpeaking).toBe(true);

      // Interrupt assistant
      outputManager.interrupt();
      expect(outputManager.isSpeaking).toBe(false);
      expect(onInterrupted).toHaveBeenCalled();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    test('AudioInputManager handles mute/unmute and track stop', () => {
      const mockTrack = { stop: jest.fn(), enabled: true };
      const inputManager = new AudioInputManager();
      inputManager.stream = {
        getTracks: () => [mockTrack],
        getAudioTracks: () => [mockTrack]
      };

      inputManager.mute();
      expect(inputManager.isMuted).toBe(true);
      expect(mockTrack.enabled).toBe(false);

      inputManager.unmute();
      expect(inputManager.isMuted).toBe(false);
      expect(mockTrack.enabled).toBe(true);

      inputManager.stopMicrophone();
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(inputManager.stream).toBeNull();
    });
  });

  describe('3. Live Session Manager FSM & Invariants', () => {
    test('enforces single active session and cleans up old session on new start', async () => {
      const manager = new LiveSessionManager({ audioEngine: mockAudioEngine });

      // Mock mediaDevices.getUserMedia
      navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn(), enabled: true }],
          getAudioTracks: () => [{ stop: jest.fn(), enabled: true }]
        })
      };

      // Mock Web Speech Recognition
      window.webkitSpeechRecognition = function () {
        this.continuous = false;
        this.interimResults = false;
        this.start = jest.fn();
        this.stop = jest.fn();
        this.abort = jest.fn();
      };

      const res1 = await manager.startSession();
      expect(res1.success).toBe(true);
      expect(manager.status).toBe(LIVE_SESSION_STATUS.LISTENING);

      const firstSessionId = manager.activeSessionId;

      // Starting a second session should cleanly end the first
      const res2 = await manager.startSession();
      expect(res2.success).toBe(true);
      expect(manager.activeSessionId).not.toBe(firstSessionId);

      // Clean teardown
      await manager.endSession();
      expect(manager.status).toBe(LIVE_SESSION_STATUS.IDLE);
      expect(manager.activeSessionId).toBeNull();
    });

    test('persists conversation highlights to MemoryService on end without storing raw audio', async () => {
      const manager = new LiveSessionManager({ audioEngine: mockAudioEngine });
      const storeSpy = jest.spyOn(memoryService, 'storeRecord');

      manager.transcriptManager = new LiveTranscriptManager({ sessionId: 'test_live_mem' });
      manager.transcriptManager.addUtterance('USER', 'What are we designing today?');
      manager.transcriptManager.addUtterance('ASSISTANT', 'We are architecting the real-time Live cognitive core.');

      await manager.endSession();

      expect(storeSpy).toHaveBeenCalled();
      const lastCall = storeSpy.mock.calls[storeSpy.mock.calls.length - 1][0];
      expect(lastCall.content).toContain('Live Spoken Conversation Session');
      // Invariant: Zero raw audio persisted
      expect(lastCall.metadata?.rawAudio).toBeUndefined();

      storeSpy.mockRestore();
    });
  });

  describe('4. Live Conversation Context & Prompt Pacing', () => {
    test('compiles spoken system instructions enforcing conversational brevity', () => {
      const context = new LiveConversationContext({ sessionId: 'sess_123' });
      const prompt = context.compileLiveSystemPrompt();

      expect(prompt).toContain('VOICE-NATIVE SPOKEN DIRECTIVES');
      expect(prompt).toContain('Speak in short, conversational paragraphs');
      expect(prompt).toContain('NEVER output markdown tables, raw LaTeX blocks, or bullet lists');
      expect(prompt).toContain('ADHY COGNITIVE MODEL CONTEXT');
    });
  });
});

describe('MINI-ADHY PHASE 10B: Real-Time Visual Perception & Spatial Intelligence', () => {
  describe('1. Visual Input Manager & Sampling', () => {
    test('evaluates brightness and rejects extreme over/under exposure', () => {
      const manager = new VisualInputManager();
      const mockCtx = {
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(250) // Almost pure white
        })
      };

      const qualityBright = manager._assessFrameQuality(mockCtx, 100, 100);
      expect(qualityBright.isTooBright).toBe(true);
      expect(qualityBright.isAcceptable).toBe(false);

      // Normal exposure
      mockCtx.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(120)
      });
      const qualityNormal = manager._assessFrameQuality(mockCtx, 100, 100);
      expect(qualityNormal.isAcceptable).toBe(true);
    });

    test('stops camera tracks cleanly upon stopCamera', () => {
      const manager = new VisualInputManager();
      const mockTrack = { stop: jest.fn() };
      manager.mediaStream = { getTracks: () => [mockTrack] };
      manager.isStreaming = true;

      manager.stopCamera();
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(manager.isStreaming).toBe(false);
      expect(manager.mode).toBe(VISUAL_INPUT_MODE.INACTIVE);
    });
  });

  describe('2. Visual Intelligence Engine & Spatial Reasoning', () => {
    test('computes spatial relationships between bounding boxes', () => {
      const engine = new VisualIntelligenceEngine();
      const perceptionResult = {
        detectedObjects: [
          { id: 'MCU_1', label: 'RP2040 Microcontroller', bbox: [0.4, 0.2, 0.6, 0.4], category: OBJECT_CATEGORY.INTEGRATED_CIRCUIT },
          { id: 'RES_1', label: '10k Pull-Up Resistor', bbox: [0.4, 0.45, 0.6, 0.55], category: OBJECT_CATEGORY.PASSIVE }
        ],
        scene: { summary: 'Custom breakout PCB with ARM Cortex-M0+' },
        ocrTexts: [{ text: 'RP2040-B2' }]
      };

      const observation = engine.synthesizeObservation(perceptionResult, { width: 1000, height: 800 });

      expect(observation.objects).toHaveLength(2);
      expect(observation.spatialRelationships.length).toBeGreaterThan(0);

      // RP2040 (xmin: 0.2) is to the left of Resistor (xmin: 0.45)
      const leftRel = observation.spatialRelationships.find(r => r.predicate === SPATIAL_RELATIONSHIP_TYPE.LEFT_OF);
      expect(leftRel).toBeDefined();
      expect(leftRel.subjectId).toBe('MCU_1');
      expect(leftRel.objectId).toBe('RES_1');
    });

    test('enforces Three-Tier Epistemic Separation in structured output', () => {
      const engine = new VisualIntelligenceEngine();
      const perception = {
        detectedObjects: [{ id: '1', label: 'STM32F401', category: 'INTEGRATED_CIRCUIT' }],
        scene: { summary: 'Black pill development board' },
        ocrTexts: [{ text: 'STM32F401CEU6' }],
        engineeringAssessment: { uncertaintyNotes: 'Verify decoupling capacitor ratings.' }
      };

      const obs = engine.synthesizeObservation(perception);
      expect(obs.epistemicTiers).toBeDefined();
      expect(obs.epistemicTiers.directObservation).toContain('STM32F401');
      expect(obs.epistemicTiers.directObservation).toContain('STM32F401CEU6');
      expect(obs.epistemicTiers.interpretation).toContain('Black pill development board');
      expect(obs.epistemicTiers.hypothesis).toContain('Verify decoupling capacitor ratings');
    });
  });

  describe('3. Visual Session Memory & Reference Resolution', () => {
    test('tracks object temporal dynamics (appeared, stable, moved) across frames', () => {
      const sessionMemory = new VisualSessionMemory({ sessionId: 'test_vis_sess' });

      // Frame 1
      const obs1 = {
        observationId: 'obs_1',
        objects: [
          { id: 'CHIP_1', label: 'ESP32-WROOM-32E', bbox: [0.3, 0.3, 0.7, 0.7], category: 'INTEGRATED_CIRCUIT' }
        ]
      };
      const rec1 = sessionMemory.ingestObservation(obs1);
      expect(rec1.changes.appeared).toHaveLength(1);
      expect(rec1.changes.appeared[0].id).toBe('CHIP_1');

      // Frame 2: Object is stable
      const obs2 = {
        observationId: 'obs_2',
        objects: [
          { id: 'CHIP_1', label: 'ESP32-WROOM-32E', bbox: [0.31, 0.31, 0.71, 0.71], category: 'INTEGRATED_CIRCUIT' }
        ]
      };
      const rec2 = sessionMemory.ingestObservation(obs2);
      expect(rec2.changes.stable).toHaveLength(1);

      // Frame 3: Object moved significantly
      const obs3 = {
        observationId: 'obs_3',
        objects: [
          { id: 'CHIP_1', label: 'ESP32-WROOM-32E', bbox: [0.1, 0.1, 0.4, 0.4], category: 'INTEGRATED_CIRCUIT' }
        ]
      };
      const rec3 = sessionMemory.ingestObservation(obs3);
      expect(rec3.changes.moved).toHaveLength(1);
    });

    test('resolves deictic conversational references ("what is this?", "what is beside it?")', () => {
      const sessionMemory = new VisualSessionMemory();
      sessionMemory.ingestObservation({
        observationId: 'obs_focal',
        objects: [
          { id: 'MAIN_IC', label: 'ATmega328P', bbox: [0.45, 0.45, 0.55, 0.55], category: 'INTEGRATED_CIRCUIT' },
          { id: 'XTAL', label: '16MHz Crystal Oscillator', bbox: [0.45, 0.65, 0.55, 0.75], category: 'PASSIVE' }
        ],
        spatialRelationships: [
          { subjectId: 'MAIN_IC', predicate: 'ADJACENT_TO', objectId: 'XTAL' }
        ]
      });

      // 1. "What is this?" should resolve to focal / central component (ATmega328P)
      const thisRef = sessionMemory.resolveReference('What is this?');
      expect(thisRef.object.label).toBe('ATmega328P');

      // 2. "What is beside it?" should resolve to neighbor (16MHz Crystal)
      const besideRef = sessionMemory.resolveReference('What is beside it?');
      expect(besideRef.object.label).toBe('16MHz Crystal Oscillator');
    });
  });

  describe('4. Visual Context Compiler & Safety Disclaimers', () => {
    test('injects mandatory hardware/continuity safety disclaimer when electronics are visible', () => {
      const compiler = new VisualContextCompiler();
      const memory = new VisualSessionMemory();
      memory.ingestObservation({
        observationId: 'obs_safety',
        objects: [{ id: 'FET_1', label: 'IRFZ44N MOSFET', category: OBJECT_CATEGORY.POWER }]
      });

      const promptContext = compiler.compileVisualContext(memory);
      expect(promptContext).toContain('CURRENT REAL-TIME VISUAL CONTEXT');
      expect(promptContext).toContain('IRFZ44N MOSFET [POWER]');
      expect(promptContext).toContain('Safety Rule: Visual proximity does NOT confirm electrical continuity');
    });

    test('generates spoken visual hint for low-latency live conversational turns', () => {
      const compiler = new VisualContextCompiler();
      const memory = new VisualSessionMemory();
      memory.ingestObservation({
        observationId: 'obs_hint',
        scene: { summary: 'breadboard prototype' },
        objects: [
          { id: '1', label: 'ESP32' },
          { id: '2', label: 'OLED Display' }
        ]
      });

      const spokenHint = compiler.compileSpokenVisualHint(memory);
      expect(spokenHint).toContain('You currently see: ESP32, OLED Display in a breadboard prototype');
    });
  });

  describe('5. Visual Conversation Bridge End-to-End Coordination', () => {
    test('processes frame through perception and compiles context for live queries', async () => {
      const bridge = new VisualConversationBridge({ sessionId: 'bridge_test' });

      // Mock perception engine perceiveFrame
      jest.spyOn(bridge.perceptionEngine, 'perceiveFrame').mockResolvedValue({
        timestamp: new Date().toISOString(),
        scene: { summary: 'STM32 development board' },
        detectedObjects: [
          { id: 'MCU', label: 'STM32F4', category: 'INTEGRATED_CIRCUIT', bbox: [0.4, 0.4, 0.6, 0.6] }
        ],
        ocrTexts: [{ text: 'ARM Cortex-M4' }]
      });

      const frameData = { width: 640, height: 480, base64: 'mock_base64_img' };
      const obs = await bridge.processFrame(frameData);

      expect(obs).toBeDefined();
      expect(obs.objects[0].label).toBe('STM32F4');

      const compiled = bridge.getCompiledContext('What chip is this?');
      expect(compiled).toContain('STM32F4');
      expect(compiled).toContain('Deictic Reference Context: The user\'s query likely refers to "STM32F4"');

      bridge.destroy();
    });
  });
});

