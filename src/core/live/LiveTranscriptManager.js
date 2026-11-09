/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVE TRANSCRIPT MANAGER — UTTERANCE & CONTINUITY TRACKING (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Synchronizes real-time speech transcripts, timestamped turns, and
 * integrates session summaries into canonical memory upon completion.
 * 
 * STRICT INVARIANT:
 * Raw audio frames are NEVER stored permanently. Only sanitized
 * transcribed text and high-level session observations are retained.
 */

import { TURN_SPEAKER } from './LiveSessionTypes';
import { memoryService, MEMORY_CATEGORIES, MEMORY_TYPES } from '../memory/MemoryService';

export class LiveTranscriptManager {
  constructor(options = {}) {
    this.sessionId = options.sessionId || `live_session_${Date.now()}`;
    this.utterances = [];
    this.interimUserText = '';
    this.interimAssistantText = '';
    this.maxUtterances = options.maxUtterances || 100;
  }

  setInterimText(speaker, text) {
    if (speaker === TURN_SPEAKER.USER) {
      this.interimUserText = text;
    } else {
      this.interimAssistantText = text;
    }
  }

  clearInterimText(speaker) {
    if (speaker === TURN_SPEAKER.USER) {
      this.interimUserText = '';
    } else {
      this.interimAssistantText = '';
    }
  }

  /**
   * Commits a completed spoken turn to the live transcript ledger
   * Supports both object parameters and positional arguments
   */
  addUtterance(speakerOrObj, maybeText = '', maybeInterrupted = false) {
    let speaker = TURN_SPEAKER.USER;
    let text = '';
    let isInterrupted = false;
    let latencyMs = null;
    let metadata = {};

    if (speakerOrObj && typeof speakerOrObj === 'object') {
      speaker = speakerOrObj.speaker || TURN_SPEAKER.USER;
      text = speakerOrObj.text || '';
      isInterrupted = speakerOrObj.isInterrupted || false;
      latencyMs = speakerOrObj.latencyMs ?? null;
      metadata = speakerOrObj.metadata || {};
    } else {
      speaker = speakerOrObj || TURN_SPEAKER.USER;
      text = maybeText;
      isInterrupted = Boolean(maybeInterrupted);
    }

    const cleanText = String(text).trim();
    if (!cleanText) return null;

    const utterance = {
      id: `utt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId: this.sessionId,
      speaker,
      text: cleanText,
      timestamp: new Date().toISOString(),
      isInterrupted: Boolean(isInterrupted),
      latencyMs: typeof latencyMs === 'number' ? latencyMs : null,
      metadata
    };

    this.utterances.push(utterance);
    if (this.utterances.length > this.maxUtterances) {
      this.utterances.shift();
    }

    this.clearInterimText(speaker);
    return utterance;
  }

  markLastAssistantUtteranceInterrupted() {
    for (let i = this.utterances.length - 1; i >= 0; i--) {
      if (this.utterances[i].speaker === TURN_SPEAKER.ASSISTANT) {
        this.utterances[i].isInterrupted = true;
        this.utterances[i].text += ' [interrupted]';
        break;
      }
    }
  }

  getTranscriptHistory() {
    return [...this.utterances];
  }

  /**
   * Persists high-level conversation summary to MemoryService on session end
   */
  commitSessionToMemory() {
    if (this.utterances.length === 0) return null;

    const userTurns = this.utterances.filter(u => u.speaker === TURN_SPEAKER.USER);
    const assistantTurns = this.utterances.filter(u => u.speaker === TURN_SPEAKER.ASSISTANT);

    const summaryText = `Live Spoken Conversation Session: ${userTurns.length} user turns, ${assistantTurns.length} assistant turns. Topics discussed: ${userTurns.slice(0, 3).map(u => `"${u.text.slice(0, 60)}"`).join('; ')}.`;

    const memoryRecord = {
      id: `mem_live_${this.sessionId}`,
      category: MEMORY_CATEGORIES.SESSION_SUMMARY,
      memoryType: MEMORY_TYPES.TEMPORARY_CONTEXT,
      content: summaryText,
      source: 'Mini-Adhy Live Mode Voice Session',
      provenance: `Live Mode Session ID ${this.sessionId}`,
      confidence: 0.95,
      verified: true,
      userApproved: true
    };

    if (memoryService && typeof memoryService.storeRecord === 'function') {
      memoryService.storeRecord(memoryRecord);
    }

    return memoryRecord;
  }

  reset() {
    this.utterances = [];
    this.interimUserText = '';
    this.interimAssistantText = '';
  }
}

