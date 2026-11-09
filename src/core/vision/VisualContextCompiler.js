/**
 * ════════════════════════════════════════════════════════════════════
 *  VISUAL CONTEXT COMPILER — PROMPT INTEGRATION (PHASE 10B)
 * ════════════════════════════════════════════════════════════════════
 * Converts structured visual session memory and latest observations into
 * a compact, token-efficient, high-signal context block for the cognitive core:
 * 1. Formats 3-tier epistemic observations (Direct, Interpretation, Hypothesis)
 * 2. Injects visible hardware/electronic components and OCR text
 * 3. Enforces safety disclaimers (no electrical continuity assumption)
 * 4. Resolves conversational pointers ("this", "that", "the adjacent part")
 */

import { VISUAL_SAFETY_DISCLAIMER } from './VisualTypes';

export class VisualContextCompiler {
  /**
   * Compiles current visual state into a concise system prompt section
   * @param {Object} visualSessionMemory - Instance of VisualSessionMemory
   * @param {Object} options - { query, includeSafety, maxTokens }
   * @returns {string} Formatted context block
   */
  compileVisualContext(visualSessionMemory, options = {}) {
    if (!visualSessionMemory) return '';

    const latest = visualSessionMemory.getLatestObservation();
    if (!latest) return '';

    const lines = [
      '### CURRENT REAL-TIME VISUAL CONTEXT',
      `Observation Timestamp: ${latest.timestamp}`,
      `Visible Scene: ${latest.sceneSummary || 'Active camera view'}`
    ];

    // 1. Direct Observations & Detected Objects
    if (latest.objects && latest.objects.length > 0) {
      lines.push('Visible Objects:');
      latest.objects.forEach(obj => {
        const confStr = obj.confidence ? ` (conf: ${Math.round(obj.confidence * 100)}%)` : '';
        const catStr = obj.category ? ` [${obj.category}]` : '';
        lines.push(` - ${obj.label}${catStr}${confStr}`);
      });
    }

    // 2. Spatial Relationships
    if (latest.spatialRelationships && latest.spatialRelationships.length > 0) {
      lines.push('Spatial Configuration:');
      latest.spatialRelationships.slice(0, 6).forEach(rel => {
        lines.push(` - ${rel.subjectLabel} is ${rel.predicate.replace(/_/g, ' ').toLowerCase()} ${rel.objectLabel}`);
      });
    }

    // 3. OCR Text Extracted from physical markings
    if (latest.ocrTexts && latest.ocrTexts.length > 0) {
      const texts = latest.ocrTexts.map(t => `"${t.text}"`).join(', ');
      lines.push(`Visible Text / Markings: ${texts}`);
    }

    // 4. Three-Tier Epistemic Breakdown
    if (latest.epistemicTiers) {
      const { directObservation, interpretation, hypothesis } = latest.epistemicTiers;
      lines.push('Epistemic Categorization:');
      if (directObservation) lines.push(` - Direct Observation: ${directObservation}`);
      if (interpretation) lines.push(` - Semantic Interpretation: ${interpretation}`);
      if (hypothesis) lines.push(` - Hypothesis / Inferred: ${hypothesis}`);
    }

    // 5. Conversational Reference Hints
    if (options.query) {
      const resolved = visualSessionMemory.resolveReference(options.query);
      if (resolved && resolved.object) {
        lines.push(`Deictic Reference Context: The user's query likely refers to "${resolved.object.label}" (${resolved.source}).`);
      }
    }

    // 6. Safety Disclaimers (Hardware / Electronics)
    const hasElectronics = (latest.objects || []).some(o => 
      ['INTEGRATED_CIRCUIT', 'PASSIVE', 'CONNECTOR', 'POWER', 'PCB'].includes(o.category)
    );
    if (hasElectronics || options.includeSafety) {
      lines.push(`Safety Rule: ${VISUAL_SAFETY_DISCLAIMER.NO_ELECTRICAL_CONTINUITY_GUARANTEE}`);
    }

    return lines.join('\n');
  }

  /**
   * Generates a single-line summary of visible context for concise spoken live responses
   */
  compileSpokenVisualHint(visualSessionMemory) {
    if (!visualSessionMemory) return '';
    const latest = visualSessionMemory.getLatestObservation();
    if (!latest || !latest.objects || latest.objects.length === 0) return '';

    const labels = latest.objects.slice(0, 3).map(o => o.label).join(', ');
    return `[You currently see: ${labels}${latest.sceneSummary ? ` in a ${latest.sceneSummary}` : ''}]`;
  }
}

