/**
 * ════════════════════════════════════════════════════════════════════
 *  VISUAL PERCEPTION ENGINE — VLM, OCR & COMPONENT DETECTION (PHASE 10B)
 * ════════════════════════════════════════════════════════════════════
 * Processes camera frames through multimodal vision models to extract:
 * 1. Semantic scene descriptions and object bounding boxes
 * 2. OCR text, IC part markings, and silkscreen labels
 * 3. Deep engineering & electronics specialization (PCBs, passives, ICs)
 * 
 * STRICT INVARIANTS:
 * 1. Radical Honesty: Never fabricates part numbers when markings are blurred.
 * 2. Visual Safety: Proximity does not imply electrical continuity.
 * 3. Non-Diagnosis / Privacy: Never identifies humans by name or sensitive traits.
 */

import { providerRegistry } from '../providers/ProviderRegistry';
import { OBJECT_CATEGORY, VISUAL_SAFETY_DISCLAIMER } from './VisualTypes';

export class VisualPerceptionEngine {
  constructor(options = {}) {
    this.providerRegistry = options.providerRegistry || providerRegistry;
    this.engineeringMode = options.engineeringMode !== false;
  }

  /**
   * Primary perception pipeline: Analyzes image frame and returns structured detections
   */
  async perceiveFrame(frameData, options = {}) {
    if (!frameData || (!frameData.base64 && !frameData.imageUrl)) {
      throw new Error('Valid frame data with base64 or imageUrl is required.');
    }

    const promptText = options.userPrompt || this._buildPerceptionPrompt(options);

    // Multimodal payload for ProviderRegistry
    const imagePart = frameData.base64
      ? {
          inlineData: {
            mimeType: 'image/jpeg',
            data: frameData.base64
          }
        }
      : {
          fileData: {
            fileUri: frameData.imageUrl,
            mimeType: 'image/jpeg'
          }
        };

    const requestPayload = {
      prompt: promptText,
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            imagePart
          ]
        }
      ]
    };

    try {
      const result = await this.providerRegistry.generateWithFallback(requestPayload, {
        requiresVision: true,
        temperature: 0.2, // Low temperature for high factual accuracy in OCR and component specs
        timeoutMs: options.timeoutMs || 10000
      });

      const parsed = this._parseVisionResponse(result.text);
      return {
        success: true,
        timestamp: new Date().toISOString(),
        rawText: result.text,
        scene: parsed.scene,
        detectedObjects: parsed.detectedObjects,
        ocrTexts: parsed.ocrTexts,
        engineeringAssessment: parsed.engineeringAssessment,
        disclaimer: VISUAL_SAFETY_DISCLAIMER.NO_ELECTRICAL_CONTINUITY_GUARANTEE,
        provider: result.actualProvider || result.executedByProvider
      };
    } catch (err) {
      // Return structured fallback observation on error
      return {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
        scene: { summary: 'Visual perception encountered an error or timeout.' },
        detectedObjects: [],
        ocrTexts: []
      };
    }
  }

  _buildPerceptionPrompt(options = {}) {
    return [
      `You are Mini-Adhy's Visual Perception Engine. Analyze this image with rigorous engineering precision.`,
      `Output your analysis strictly in valid JSON format with the following schema:`,
      `{`,
      `  "scene": { "summary": "Concise high-level description of scene and environment", "type": "ELECTRONICS_BENCH | LAB | WORKSPACE | GENERAL" },`,
      `  "detectedObjects": [`,
      `    { "label": "Object name", "category": "INTEGRATED_CIRCUIT | PASSIVE | CONNECTOR | POWER | PCB | INSTRUMENT | TOOL | EVERYDAY_OBJECT", "confidence": 0.0-1.0, "bbox": [ymin, xmin, ymax, xmax], "attributes": { "package": "SMD/DIP", "markings": "Text" } }`,
      `  ],`,
      `  "ocrTexts": [`,
      `    { "text": "Extracted text or IC part number", "confidence": 0.0-1.0, "isPartiallyBlurred": boolean }`,
      `  ],`,
      `  "engineeringAssessment": {`,
      `    "pcbComponents": ["Key components visible"],`,
      `    "visibleDefectsOrBridges": ["Any suspect solder bridges, burn marks, or misalignments"],`,
      `    "uncertaintyNotes": "Clearly note any blurred, reflective, or unreadable IC markings"`,
      `  }`,
      `}`,
      `STRICT RULES:`,
      `1. NEVER guess or invent IC part numbers if unreadable. If blurred, set isPartiallyBlurred: true.`,
      `2. Never claim electrical connectivity simply because two traces or pins appear close together.`,
      `3. Do not identify individuals by name.`
    ].join('\n');
  }

  _parseVisionResponse(rawText = '') {
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          scene: parsed.scene || { summary: 'Visible scene' },
          detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects : [],
          ocrTexts: Array.isArray(parsed.ocrTexts) ? parsed.ocrTexts : [],
          engineeringAssessment: parsed.engineeringAssessment || {}
        };
      }
    } catch {}

    // Fallback parser if LLM returns prose
    return {
      scene: { summary: rawText.slice(0, 200).replace(/\n/g, ' ') },
      detectedObjects: this._heuristicExtractComponents(rawText),
      ocrTexts: []
    };
  }

  _heuristicExtractComponents(text = '') {
    const objects = [];
    const lower = text.toLowerCase();
    if (lower.includes('stm32') || lower.includes('microcontroller') || lower.includes('ic') || lower.includes('chip')) {
      objects.push({ label: 'Microcontroller / IC', category: OBJECT_CATEGORY.INTEGRATED_CIRCUIT, confidence: 0.88 });
    }
    if (lower.includes('capacitor') || lower.includes('resistor') || lower.includes('inductor')) {
      objects.push({ label: 'Passive Component', category: OBJECT_CATEGORY.PASSIVE, confidence: 0.85 });
    }
    if (lower.includes('pcb') || lower.includes('circuit board')) {
      objects.push({ label: 'Printed Circuit Board', category: OBJECT_CATEGORY.PCB, confidence: 0.92 });
    }
    return objects;
  }
}

export const visualPerceptionEngine = new VisualPerceptionEngine();


