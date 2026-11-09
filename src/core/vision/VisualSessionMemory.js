/**
 * ════════════════════════════════════════════════════════════════════
 *  VISUAL SESSION MEMORY — TEMPORAL TRACKING & REFERENCE RESOLUTION (PHASE 10B)
 * ════════════════════════════════════════════════════════════════════
 * Tracks visual objects, spatial dynamics, and scenes across multiple frames:
 * 1. Tracks objects across time (appeared, disappeared, moved, stable)
 * 2. Resolves conversational deictic references:
 *    • "What is this?" / "What is that?" (most focal/central object)
 *    • "What is beside it?" / "What is to its right?" (spatial query resolution)
 *    • "What was that thing earlier?" (historical retrieval)
 * 3. Never stores raw frames or pixels in memory (zero raw video storage)
 * 4. Summarizes session for long-term episodic memory integration
 */

export class VisualSessionMemory {
  constructor(options = {}) {
    this.maxObservations = options.maxObservations || 50;
    this.observations = [];
    this.trackedObjects = new Map(); // id -> { id, label, category, firstSeen, lastSeen, occurrences, lastBbox, history }
    this.activeFocusObjectId = null;
    this.sessionId = options.sessionId || `vissess_${Date.now()}`;
  }

  /**
   * Ingests a new structured observation from VisualIntelligenceEngine
   * Detects temporal changes (appeared, disappeared, moved)
   */
  ingestObservation(observation) {
    if (!observation) return null;

    const timestamp = observation.timestamp || new Date().toISOString();
    const currentFrameObjects = observation.objects || [];
    const currentObjectIds = new Set();

    const changes = {
      appeared: [],
      moved: [],
      disappeared: [],
      stable: []
    };

    // 1. Process objects present in current frame
    for (const obj of currentFrameObjects) {
      currentObjectIds.add(obj.id);
      if (!this.trackedObjects.has(obj.id)) {
        // Newly appeared
        const tracked = {
          id: obj.id,
          label: obj.label,
          category: obj.category,
          firstSeen: timestamp,
          lastSeen: timestamp,
          occurrences: 1,
          lastBbox: obj.bbox,
          attributes: obj.attributes || {}
        };
        this.trackedObjects.set(obj.id, tracked);
        changes.appeared.push(tracked);
      } else {
        // Existing object
        const tracked = this.trackedObjects.get(obj.id);
        tracked.lastSeen = timestamp;
        tracked.occurrences += 1;
        tracked.label = obj.label || tracked.label;

        // Check if moved
        if (tracked.lastBbox && obj.bbox) {
          const dy = Math.abs(tracked.lastBbox[0] - obj.bbox[0]);
          const dx = Math.abs(tracked.lastBbox[1] - obj.bbox[1]);
          if (dx > 0.08 || dy > 0.08) {
            changes.moved.push({ ...tracked, newBbox: obj.bbox });
          } else {
            changes.stable.push(tracked);
          }
        } else {
          changes.stable.push(tracked);
        }
        tracked.lastBbox = obj.bbox;
      }
    }

    // 2. Determine default focus object (closest to center or highest confidence)
    if (currentFrameObjects.length > 0) {
      const centralObj = this._findMostCentralObject(currentFrameObjects);
      if (centralObj) {
        this.activeFocusObjectId = centralObj.id;
      }
    }

    // 3. Store structured observation record (trim if exceeds maxObservations)
    const record = {
      observationId: observation.observationId,
      timestamp,
      sceneSummary: observation.scene?.summary || '',
      objectCount: currentFrameObjects.length,
      objects: currentFrameObjects,
      spatialRelationships: observation.spatialRelationships || [],
      ocrTexts: observation.ocrTexts || [],
      epistemicTiers: observation.epistemicTiers || {},
      changes
    };

    this.observations.push(record);
    if (this.observations.length > this.maxObservations) {
      this.observations.shift();
    }

    return record;
  }

  /**
   * Resolves conversational references like "what is this?", "what is beside it?"
   */
  resolveReference(query = '') {
    const q = query.toLowerCase();
    const latest = this.getLatestObservation();
    if (!latest) return null;

    // Check spatial follow-up queries: "beside", "next to", "left of", "right of"
    if (q.includes('beside') || q.includes('next to') || q.includes('near')) {
      return this._resolveNeighbor(this.activeFocusObjectId, 'ADJACENT_TO');
    }
    if (q.includes('left of') || q.includes('to the left')) {
      return this._resolveNeighbor(this.activeFocusObjectId, 'LEFT_OF');
    }
    if (q.includes('right of') || q.includes('to the right')) {
      return this._resolveNeighbor(this.activeFocusObjectId, 'RIGHT_OF');
    }

    // Direct deictic query: "what is this", "what am I holding", "what is that"
    if (q.includes('this') || q.includes('that') || q.includes('looking at') || q.includes('holding')) {
      if (this.activeFocusObjectId && this.trackedObjects.has(this.activeFocusObjectId)) {
        return {
          object: this.trackedObjects.get(this.activeFocusObjectId),
          source: 'current_focus',
          allObjects: latest.objects
        };
      }
      if (latest.objects.length > 0) {
        return {
          object: latest.objects[0],
          source: 'primary_visible',
          allObjects: latest.objects
        };
      }
    }

    // Named query (e.g., "where is the resistor?", "what about the chip?")
    for (const [id, tracked] of this.trackedObjects.entries()) {
      if (q.includes(tracked.label.toLowerCase()) || q.includes(tracked.category.toLowerCase())) {
        this.activeFocusObjectId = id;
        return {
          object: tracked,
          source: 'named_match',
          allObjects: latest.objects
        };
      }
    }

    // Default fallback: latest focus or scene
    return {
      object: this.activeFocusObjectId ? this.trackedObjects.get(this.activeFocusObjectId) : null,
      source: 'scene_overview',
      sceneSummary: latest.sceneSummary,
      allObjects: latest.objects
    };
  }

  /**
   * Resolves a neighboring object based on spatial predicates
   */
  _resolveNeighbor(subjectId, predicate) {
    const latest = this.getLatestObservation();
    if (!latest || !latest.spatialRelationships) return null;

    const matches = latest.spatialRelationships.filter(rel => {
      const matchSubj = !subjectId || rel.subjectId === subjectId;
      const matchPred = !predicate || rel.predicate === predicate;
      return matchSubj && matchPred;
    });

    if (matches.length > 0) {
      const targetId = matches[0].objectId;
      const targetObj = this.trackedObjects.get(targetId) || latest.objects.find(o => o.id === targetId);
      if (targetObj) {
        return {
          object: targetObj,
          relation: matches[0],
          source: 'spatial_relationship'
        };
      }
    }

    // If no direct predicate match, return any other visible object if present
    const other = latest.objects.find(o => o.id !== subjectId);
    if (other) {
      return {
        object: other,
        relation: { predicate: 'NEARBY', subjectId, objectId: other.id },
        source: 'proximity_fallback'
      };
    }

    return null;
  }

  /**
   * Finds the object closest to the normalized center of the frame ([0.5, 0.5])
   */
  _findMostCentralObject(objects) {
    if (!objects || objects.length === 0) return null;

    let bestObj = objects[0];
    let minDistance = Infinity;

    for (const obj of objects) {
      if (obj.bbox && Array.isArray(obj.bbox)) {
        const [ymin, xmin, ymax, xmax] = obj.bbox;
        const cx = (xmin + xmax) / 2;
        const cy = (ymin + ymax) / 2;
        const dist = Math.hypot(cx - 0.5, cy - 0.5);
        if (dist < minDistance) {
          minDistance = dist;
          bestObj = obj;
        }
      }
    }

    return bestObj;
  }

  /**
   * Returns the most recent structured observation
   */
  getLatestObservation() {
    return this.observations[this.observations.length - 1] || null;
  }

  /**
   * Returns all currently active objects
   */
  getActiveObjects() {
    const latest = this.getLatestObservation();
    return latest ? latest.objects : [];
  }

  /**
   * Summarizes the entire visual session for long-term memory integration
   */
  summarizeSession() {
    const totalObservations = this.observations.length;
    const trackedList = Array.from(this.trackedObjects.values());
    const uniqueLabels = [...new Set(trackedList.map(o => o.label))];
    const categories = [...new Set(trackedList.map(o => o.category))];

    const timeline = this.observations.map(obs => ({
      timestamp: obs.timestamp,
      sceneSummary: obs.sceneSummary,
      objectCount: obs.objectCount
    }));

    return {
      sessionId: this.sessionId,
      totalObservations,
      trackedObjectCount: trackedList.length,
      identifiedObjects: uniqueLabels,
      categories,
      timeline,
      sessionSummary: `Visual session observed ${uniqueLabels.length} unique items (${uniqueLabels.slice(0, 5).join(', ')}${uniqueLabels.length > 5 ? '...' : ''}) across ${totalObservations} frames.`
    };
  }

  /**
   * Clears session memory
   */
  clear() {
    this.observations = [];
    this.trackedObjects.clear();
    this.activeFocusObjectId = null;
  }
}

