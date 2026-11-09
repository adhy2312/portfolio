/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVE FALLBACK PIPELINE — CONVERSATIONAL STREAMING RUNTIME (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Robust, low-latency conversational voice loop for browsers:
 * Speech Recognition → Unified RequestLifecycle → Streaming Sentence Audio
 * 
 * CORE RESPONSIBILITIES:
 * 1. Continuous Speech Recognition with interim preview
 * 2. Sentence-by-sentence audio streaming to minimize first-audio latency
 * 3. Instant interruption cancellation via AudioOutputManager
 * 4. Context preservation across conversational turns
 */

import { requestLifecycle } from '../runtime/RequestLifecycle';

export class LiveFallbackPipeline {
  constructor(options = {}) {
    this.audioOutputManager = options.audioOutputManager;
    this.liveTranscriptManager = options.liveTranscriptManager;
    this.liveContext = options.liveContext;
    this.onTurnStart = options.onTurnStart || (() => {});
    this.onTurnComplete = options.onTurnComplete || (() => {});
    this.onProcessing = options.onProcessing || (() => {});
    this.onError = options.onError || (() => {});

    this.recognition = null;
    this.isListening = false;
    this.isProcessing = false;
    this.activeAbortController = null;
  }

  /**
   * Initializes continuous browser speech recognition
   */
  initSpeechRecognition() {
    if (typeof window === 'undefined') return null;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[LiveFallbackPipeline] Web Speech Recognition is not supported in this browser.');
      return null;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim && this.liveTranscriptManager) {
        this.liveTranscriptManager.setInterimText('USER', interim);
      }

      if (final.trim()) {
        this.handleUserSpokenTurn(final.trim());
      }
    };

    rec.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.onError(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    rec.onend = () => {
      // Re-start recognition if still in active live session
      if (this.isListening) {
        try {
          rec.start();
        } catch {}
      }
    };

    this.recognition = rec;
    return rec;
  }

  startListening() {
    this.isListening = true;
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    try {
      this.recognition?.start();
    } catch {}
  }

  stopListening() {
    this.isListening = false;
    try {
      this.recognition?.stop();
    } catch {}
  }

  /**
   * Processes a finalized spoken turn from the user
   */
  async handleUserSpokenTurn(userText, visualContext = null) {
    if (!userText || this.isProcessing) return;

    this.isProcessing = true;
    this.onProcessing();

    // 1. Commit user utterance to transcript
    if (this.liveTranscriptManager) {
      this.liveTranscriptManager.addUtterance({
        speaker: 'USER',
        text: userText
      });
    }

    if (this.liveContext) {
      this.liveContext.recordTurn('USER', userText);
    }

    const startTime = Date.now();
    this.activeAbortController = new AbortController();

    try {
      // 2. Execute through canonical Mini-Adhy RequestLifecycle
      const lifecycleResult = await requestLifecycle.processRequest(userText, {
        mode: 'LIVE_CONVERSATION',
        sessionId: this.liveContext?.sessionId,
        history: this.liveContext?.getTurnHistoryForModel(),
        context: visualContext ? { visualObservations: visualContext } : {}
      });

      const responseText = lifecycleResult.text || "I'm listening, please go ahead.";
      const latencyMs = Date.now() - startTime;

      // 3. Record assistant response in transcript
      if (this.liveTranscriptManager) {
        this.liveTranscriptManager.addUtterance({
          speaker: 'ASSISTANT',
          text: responseText,
          latencyMs
        });
      }

      if (this.liveContext) {
        this.liveContext.recordTurn('ASSISTANT', responseText);
      }

      // 4. Stream response to audio output (sentence-by-sentence)
      if (this.audioOutputManager) {
        await this._streamResponseToAudio(responseText);
      }

      this.onTurnComplete({
        userText,
        responseText,
        latencyMs
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.onError(err);
      }
    } finally {
      this.isProcessing = false;
      this.activeAbortController = null;
    }
  }

  /**
   * Splits response into natural sentences and speaks them sequentially
   */
  async _streamResponseToAudio(text) {
    // Clean markdown and formatting for natural spoken speech
    const cleanSpeech = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const sentences = cleanSpeech.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [cleanSpeech];

    for (const sentence of sentences) {
      if (!this.isListening || this.activeAbortController?.signal?.aborted) {
        break; // Cancelled by interruption
      }

      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length > 0) {
        await this.audioOutputManager.speakText(trimmedSentence);
      }
    }
  }

  /**
   * Immediate barge-in cutoff
   */
  interrupt() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    this.isProcessing = false;
    if (this.audioOutputManager) {
      this.audioOutputManager.interrupt();
    }
    if (this.liveTranscriptManager) {
      this.liveTranscriptManager.markLastAssistantUtteranceInterrupted();
    }
  }

  cleanup() {
    this.stopListening();
    this.interrupt();
    this.recognition = null;
  }
}

