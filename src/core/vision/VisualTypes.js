/**
 * ════════════════════════════════════════════════════════════════════
 *  VISUAL INTELLIGENCE TYPES & SCHEMAS — PHASE 10B
 * ════════════════════════════════════════════════════════════════════
 */

export const VISUAL_INPUT_MODE = Object.freeze({
  INACTIVE: 'INACTIVE',
  IMAGE_UPLOAD: 'IMAGE_UPLOAD',
  CAMERA_SNAPSHOT: 'CAMERA_SNAPSHOT',
  CAMERA_STREAMING: 'CAMERA_STREAMING'
});

export const OBJECT_CATEGORY = Object.freeze({
  INTEGRATED_CIRCUIT: 'INTEGRATED_CIRCUIT',
  PASSIVE: 'PASSIVE',
  CONNECTOR: 'CONNECTOR',
  POWER: 'POWER',
  PCB: 'PCB',
  INSTRUMENT: 'INSTRUMENT',
  TOOL: 'TOOL',
  EVERYDAY_OBJECT: 'EVERYDAY_OBJECT',
  DOCUMENT: 'DOCUMENT',
  UNKNOWN: 'UNKNOWN'
});

export const SPATIAL_RELATIONSHIP_TYPE = Object.freeze({
  ADJACENT_TO: 'ADJACENT_TO',
  MOUNTED_ON: 'MOUNTED_ON',
  LEFT_OF: 'LEFT_OF',
  RIGHT_OF: 'RIGHT_OF',
  ABOVE: 'ABOVE',
  BELOW: 'BELOW',
  CONTAINED_IN: 'CONTAINED_IN'
});

export const VISUAL_SAFETY_DISCLAIMER = Object.freeze({
  NO_ELECTRICAL_CONTINUITY_GUARANTEE: 'Visual proximity does NOT confirm electrical continuity or functional safety. Always verify circuit connectivity using a multimeter.',
  NO_HIGH_VOLTAGE_SAFETY_CLAIM: 'Never assume electrical safety or de-energization from an optical image alone. Isolate and lock-out mains power sources before inspection.'
});

