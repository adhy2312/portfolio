/**
 * ════════════════════════════════════════════════════════════════════
 *  PHASE 4 — EPISODIC MEMORY AND CONTINUITY TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Verifies structured episodic memory, project continuity, decision history,
 * the 5 core contextual questions, deduplication, TTL expiration, and
 * RelationshipContinuityEngine integration into CognitiveContextCompiler.
 */

jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { MemoryService, MEMORY_CATEGORIES, MEMORY_TYPES, memoryService } from '../memory/MemoryService';
import { RelationshipContinuityEngine, relationshipContinuityEngine } from '../understanding/RelationshipContinuityEngine';
import { cognitiveContextCompiler } from '../cognition/CognitiveContextCompiler';

describe('PHASE 4 — EPISODIC MEMORY AND CONTINUITY', () => {
  let memory;
  let continuity;

  beforeEach(() => {
    memory = new MemoryService();
    memory.clearAll();
    continuity = new RelationshipContinuityEngine();
    continuity.initDefaultContinuity();
  });

  // ────────────────────────────────────────────────────────────
  // 1. Structured Memory Categories & Schema Metadata
  // ────────────────────────────────────────────────────────────
  describe('1. Memory Architecture & 7 Categories', () => {
    test('Supports all 7 Phase 4 memory categories with full metadata', () => {
      const categories = [
        MEMORY_CATEGORIES.SEMANTIC_MEMORY,
        MEMORY_CATEGORIES.EPISODIC_MEMORY,
        MEMORY_CATEGORIES.PROCEDURAL_MEMORY,
        MEMORY_CATEGORIES.DECISION_MEMORY,
        MEMORY_CATEGORIES.PROJECT_MEMORY,
        MEMORY_CATEGORIES.RELATIONSHIP_CONTINUITY,
        MEMORY_CATEGORIES.PENDING_MEMORY
      ];

      expect(categories.length).toBe(7);

      const record = memory.storeRecord({
        category: MEMORY_CATEGORIES.SEMANTIC_MEMORY,
        content: 'STM32F407 has hardware floating-point unit (FPU) and 1MB Flash memory.',
        source: 'STM32 Reference Manual',
        evidence: 'Datasheet Section 3.2',
        confidence: 1.0,
        userApproved: true,
        sensitivity: 'public',
        projectId: 'proj_sdr_transceiver',
        ttlExpiresAt: new Date(Date.now() + 86400000).toISOString()
      });

      expect(record).toBeDefined();
      expect(record.schemaVersion).toBe('3.0.0');
      expect(record.category).toBe(MEMORY_CATEGORIES.SEMANTIC_MEMORY);
      expect(record.memoryType).toBe(MEMORY_TYPES.FACT);
      expect(record.projectId).toBe('proj_sdr_transceiver');
      expect(record.ttlExpiresAt).toBeDefined();
      expect(record.userApproved).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Structured Project Records & History Tracking
  // ────────────────────────────────────────────────────────────
  describe('2. Structured Project Records & Chronological History', () => {
    test('Creates project with architecture, constraints, milestones and history', () => {
      const project = memory.createProject({
        id: 'proj_thermal_cam',
        title: 'Long-Wave Infrared (LWIR) Thermal Imaging Sensor',
        domain: 'Optics & Embedded Systems',
        objective: 'Interface FLIR Lepton 3.5 sensor with ESP32-S3 over SPI and render false-color radiometric feed.',
        status: 'active',
        technicalArchitecture: 'FLIR Lepton 3.5 SPI VoSPI -> ESP32-S3 DMA -> ST7789 IPS Display SPI with double buffering.',
        constraints: ['VoSPI packet synchronization loss if CS pin deasserted during frame transfer'],
        milestones: [
          { id: 'm1', title: 'Bring up SPI VoSPI packet stream', completed: true },
          { id: 'm2', title: 'Apply ironbow radiometric color palette', completed: false }
        ],
        outstandingTasks: [
          { id: 'task_sync', title: 'Fix VoSPI telemetry line sync timing', status: 'pending', priority: 'high' }
        ]
      });

      expect(project.id).toBe('proj_thermal_cam');
      expect(project.status).toBe('active');
      expect(project.history.length).toBe(1);
      expect(project.history[0].action).toBe('CREATED');

      // Update milestone and status
      const updated = memory.updateProject('proj_thermal_cam', {
        summary: 'Completed VoSPI stream bring-up milestone',
        milestones: [
          { id: 'm1', title: 'Bring up SPI VoSPI packet stream', completed: true },
          { id: 'm2', title: 'Apply ironbow radiometric color palette', completed: true }
        ]
      });

      expect(updated.milestones[1].completed).toBe(true);
      expect(updated.history.length).toBe(2);
      expect(updated.history[0].action).toBe('UPDATED');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Project Pausing & Cross-Session Resumption Demonstration
  // ────────────────────────────────────────────────────────────
  describe('3. Project Pause & Resumption Across Conversations', () => {
    test('Demonstration: Project can be paused with outstanding tasks and resumed in a different session', () => {
      // Step A: Active project created
      const project = memory.createProject({
        id: 'proj_neuro_dock',
        title: 'NeuroDock Desktop Companion Robot',
        domain: 'Embedded Robotics',
        objective: 'ESP32-driven mechanical robot companion with head tracking and expressive eye OLED displays.',
        status: 'active',
        outstandingTasks: [
          { id: 'task_i2c_bus', title: 'Resolve I2C address collision between dual SSD1306 displays', status: 'pending', priority: 'high' },
          { id: 'task_servo_jitter', title: 'Add low-pass filter to PCA9685 PWM servo driver to eliminate idle jitter', status: 'pending', priority: 'medium' }
        ]
      });

      expect(project.status).toBe('active');

      // Step B: Project paused with outstanding tasks
      const paused = memory.pauseProject('proj_neuro_dock', 'Paused while awaiting PCA9685 PCB delivery', [
        { id: 'task_i2c_bus', title: 'Resolve I2C address collision between dual SSD1306 displays', status: 'pending', priority: 'high' },
        { id: 'task_servo_jitter', title: 'Add low-pass filter to PCA9685 PWM servo driver to eliminate idle jitter', status: 'pending', priority: 'medium' }
      ]);

      expect(paused.status).toBe('paused');
      expect(paused.lastMeaningfulActivity).toContain('Paused while awaiting PCA9685 PCB delivery');
      expect(paused.history[0].action).toBe('PAUSED');

      // Pending memory record was generated
      const unfinished = memory.getUnfinishedWork({ projectId: 'proj_neuro_dock' });
      expect(unfinished.pausedProjects.length).toBe(1);
      expect(unfinished.pendingTasks.length).toBe(2);
      expect(unfinished.pendingTasks[0].title).toContain('Resolve I2C address collision');

      // Step C: Resumed in a new session
      const resumed = memory.resumeProject('proj_neuro_dock', 'PCBs arrived; resuming assembly on test bench');
      expect(resumed.status).toBe('active');
      expect(resumed.lastMeaningfulActivity).toContain('Resumed: PCBs arrived; resuming assembly on test bench');
      expect(resumed.history[0].action).toBe('RESUMED');

      // Outstanding tasks remain intact
      expect(resumed.outstandingTasks.length).toBe(2);
      expect(resumed.outstandingTasks[0].id).toBe('task_i2c_bus');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Structured Decision History with Alternatives and Outcomes
  // ────────────────────────────────────────────────────────────
  describe('4. Structured Decision History', () => {
    test('Records architectural decisions with alternatives considered, reasoning, and actual outcome', () => {
      const decision = memory.recordDecision({
        projectId: 'proj_sdr_transceiver',
        topic: 'Demodulation Architecture for RTL-SDR',
        decision: 'Implemented quadrature demodulation with polyphase decimation in GNU Radio.',
        context: 'Direct quadrature sampling had frequency folding at DC offset.',
        alternativesConsidered: [
          'Direct envelope detection in software (high distortion)',
          'Analog external quadrature downconverter (additional PCB hardware)',
          'Polyphase decimation filter bank in GNU Radio DSP'
        ],
        reasoning: 'Polyphase decimation achieves optimal stopband attenuation with 4x lower CPU clock cycles than direct FIR decimation.',
        constraints: ['Real-time audio buffer underrun limits on host computer'],
        expectedOutcome: 'Clean audio demodulation without DC carrier spike.',
        actualOutcome: null
      });

      expect(decision.id).toBeDefined();
      expect(decision.alternativesConsidered.length).toBe(3);
      expect(decision.reasoning).toContain('optimal stopband attenuation');
      expect(decision.actualOutcome).toBeNull();

      // Verify decision is linked to project
      const projectDecisions = memory.getDecisionsForProject('proj_sdr_transceiver');
      expect(projectDecisions.some(d => d.id === decision.id)).toBe(true);

      // Later: Update actual outcome
      const updatedDecision = memory.updateDecisionOutcome(decision.id, 'Confirmed 38dB SNR improvement with zero audio buffer underruns.');
      expect(updatedDecision.actualOutcome).toContain('Confirmed 38dB SNR improvement');

      // Recall via rationale lookup
      const recalled = memory.findDecisionRationale('quadrature demodulation polyphase decimation');
      expect(recalled.length).toBeGreaterThan(0);
      expect(recalled[0].alternativesConsidered).toContain('Direct envelope detection in software (high distortion)');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Episodic & Procedural Memory Storage
  // ────────────────────────────────────────────────────────────
  describe('5. Episodic & Procedural Memory', () => {
    test('Stores and retrieves episodic experiences', () => {
      const episode = memory.storeEpisodicRecord({
        eventName: 'KTU Tech Fest Keynote Demonstration',
        context: 'Live demo of Mini-Adhy connected to embedded SDR spectrum visualizer.',
        outcome: 'Flawless real-time FFT waterfall display before 200 attendees.',
        reflections: 'Local offline neural heuristic cache was crucial when auditorium Wi-Fi dropped.',
        participants: ['Adhy', 'Mini-Adhy', 'KTU Student Chapter']
      });

      expect(episode.category).toBe(MEMORY_CATEGORIES.EPISODIC_MEMORY);
      expect(episode.memoryType).toBe(MEMORY_TYPES.EPISODIC);
      expect(episode.structuredData.eventName).toBe('KTU Tech Fest Keynote Demonstration');

      const retrieved = memory.retrieveRelevant('waterfall display KTU auditorium');
      expect(retrieved.length).toBeGreaterThan(0);
      expect(retrieved[0].content).toContain('KTU Tech Fest Keynote Demonstration');
    });

    test('Stores and retrieves procedural workflows', () => {
      const proc = memory.storeProceduralRecord({
        workflowName: 'KiCad 8 4-Layer Controlled-Impedance Stackup Setup',
        steps: [
          'Open Board Setup -> Physical Stackup and select JLC2313 substrate',
          'Set outer copper thickness to 1oz (35um) and core dielectric constant to 4.05',
          'Configure 50-ohm single-ended trace width to 0.28mm in Net Classes',
          'Run Design Rule Check (DRC) to verify minimum clearance of 0.15mm'
        ],
        prerequisites: ['Board outlines finalized in Edge.Cuts layer'],
        tools: ['KiCad 8 PCB Editor', 'JLCPCB Stackup Calculator']
      });

      expect(proc.category).toBe(MEMORY_CATEGORIES.PROCEDURAL_MEMORY);
      expect(proc.memoryType).toBe(MEMORY_TYPES.PROCEDURE);
      expect(proc.content).toContain('Procedure [KiCad 8 4-Layer Controlled-Impedance Stackup Setup]');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Answering the 5 Core Contextual Questions
  // ────────────────────────────────────────────────────────────
  describe('6. The 5 Core Contextual Questions', () => {
    beforeEach(() => {
      memory.createProject({
        id: 'proj_quadcopter',
        title: 'Autonomous Optical Flow Quadcopter',
        objective: 'Vision-guided indoor navigation without GPS.',
        status: 'active',
        lastMeaningfulActivity: 'Calibrated PMW3901 optical flow sensor',
        outstandingTasks: [
          { id: 'task_ekf', title: 'Tune EKF fusion weights between optical flow and IMU', status: 'pending' }
        ]
      });

      memory.recordDecision({
        projectId: 'proj_quadcopter',
        topic: 'Flight Controller MCU Selection',
        decision: 'Selected STM32H743 over STM32F405.',
        alternativesConsidered: ['STM32F405 (insufficient RAM for optical flow)', 'RP2040 (no hardware double FPU)'],
        reasoning: 'STM32H743 provides 480MHz clock and 1MB RAM needed for real-time optical flow visual odometry.',
        expectedOutcome: 'Sustained 60 FPS state estimation.'
      });
    });

    test('1. "What were we working on?" -> getRecentWorkContext', () => {
      const workContext = memory.getRecentWorkContext({ projectId: 'proj_quadcopter' });
      expect(workContext.activeProjects.length).toBe(1);
      expect(workContext.activeProjects[0].title).toBe('Autonomous Optical Flow Quadcopter');
      expect(workContext.pendingTasks.length).toBe(1);
      expect(workContext.pendingTasks[0].title).toContain('Tune EKF fusion weights');
      expect(workContext.summary).toContain('Autonomous Optical Flow Quadcopter');
    });

    test('2. "Why did we choose this architecture?" -> findDecisionRationale', () => {
      const decisions = memory.findDecisionRationale('Flight Controller MCU Selection STM32H743');
      expect(decisions.length).toBeGreaterThan(0);
      expect(decisions[0].decision).toBe('Selected STM32H743 over STM32F405.');
      expect(decisions[0].alternativesConsidered).toContain('STM32F405 (insufficient RAM for optical flow)');
      expect(decisions[0].reasoning).toContain('480MHz clock and 1MB RAM');
    });

    test('3. "What did we try previously?" -> getPreviousAttempts', () => {
      const attempts = memory.getPreviousAttempts('Flight Controller MCU');
      expect(attempts.alternativesTried.length).toBeGreaterThan(0);
      expect(attempts.alternativesTried[0].alternatives).toContain('RP2040 (no hardware double FPU)');
    });

    test('4. "What remains unfinished?" -> getUnfinishedWork', () => {
      const unfinished = memory.getUnfinishedWork({ projectId: 'proj_quadcopter' });
      expect(unfinished.pendingTasks.length).toBe(1);
      expect(unfinished.pendingTasks[0].title).toBe('Tune EKF fusion weights between optical flow and IMU');
    });

    test('5. "What changed since the last session?" -> getDiffSinceLastSession', () => {
      const pastTime = new Date(Date.now() - 3600000).toISOString();
      const diff = memory.getDiffSinceLastSession(pastTime);
      expect(diff.newDecisions.length).toBeGreaterThan(0);
      expect(diff.newDecisions.some(d => d.topic === 'Flight Controller MCU Selection')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Memory Governance: Deduplication, Supersession, TTL Expiration
  // ────────────────────────────────────────────────────────────
  describe('7. Memory Governance (Deduplication, TTL, Security)', () => {
    test('Deduplication prevents near-duplicate records (>85% token overlap)', () => {
      const first = memory.storeRecord({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'STM32 microcontrollers are programmed using STM32CubeIDE and SWD debug probes.'
      });

      // Second attempt with >85% token overlap
      const duplicate = memory.storeRecord({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'STM32 microcontrollers are programmed using STM32CubeIDE and SWD debug probes.'
      });

      expect(duplicate.id).toBe(first.id);
    });

    test('Contradiction & Supersession links mark previous records as SUPERSEDED_INFO', () => {
      const oldRole = memory.storeRecord({
        id: 'mem_role_pr_head',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Adhy is PR & Media Head of ISTE Students Chapter MBCET.'
      });

      const newRole = memory.storeRecord({
        category: MEMORY_CATEGORIES.CORRECTED_FACT,
        content: 'Adhy is now Chairperson of ISTE Students Chapter MBCET.',
        supersedes: 'mem_role_pr_head'
      });

      expect(newRole.supersedes).toBe('mem_role_pr_head');
      const updatedOld = memory.records.get('mem_role_pr_head');
      expect(updatedOld.category).toBe(MEMORY_CATEGORIES.SUPERSEDED_INFO);
      expect(updatedOld.supersededBy).toBe(newRole.id);
    });

    test('TTL Expiration excludes expired records from retrieval and purges them cleanly', () => {
      // Store expired memory
      memory.storeRecord({
        id: 'mem_temp_wifi',
        category: MEMORY_CATEGORIES.WORKING_CONTEXT,
        content: 'Temporary lab Wi-Fi guest key valid for today only',
        ttlExpiresAt: new Date(Date.now() - 1000).toISOString()
      });

      // Normal valid memory
      memory.storeRecord({
        id: 'mem_permanent_lab',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'DSP Lab is located on the second floor of the ECE block'
      });

      // retrieveRelevant should automatically exclude expired record
      const active = memory.retrieveRelevant('lab');
      expect(active.some(r => r.id === 'mem_temp_wifi')).toBe(false);
      expect(active.some(r => r.id === 'mem_permanent_lab')).toBe(true);

      // Purge cleans up records
      const purged = memory.purgeExpiredMemories();
      expect(purged).toBe(1);
      expect(memory.records.has('mem_temp_wifi')).toBe(false);
    });

    test('Security Invariant: Rejects bearer tokens, private keys and API keys', () => {
      const secretRecord = memory.storeRecord({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Here is my secret Bearer gsk_99238472938479238472938472398472'
      });
      expect(secretRecord).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Relationship Continuity Engine & Compiler Integration
  // ────────────────────────────────────────────────────────────
  describe('8. Continuity Engine & Cognitive Context Compiler Integration', () => {
    test('RelationshipContinuityEngine generates compact summary within 400 tokens', () => {
      const summary = continuity.getCompactContinuitySummary();
      expect(summary).toBeDefined();
      expect(summary).toContain('Active Project:');
      expect(summary).toContain('Key Architectural Decision:');

      // Token estimation check (~4 characters per token)
      const tokenEstimate = Math.ceil(summary.length / 4);
      expect(tokenEstimate).toBeLessThan(400);
    });

    test('CognitiveContextCompiler incorporates active continuity into system context', () => {
      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Review our current architecture decisions for the Mini-Adhy companion robot'
      });

      expect(compiled.taskCategory).toBeDefined();
      expect(compiled.continuity).toBeDefined();
      expect(compiled.formattedBlock).toContain('#### ACTIVE CONTINUITY');
      expect(compiled.formattedBlock).toContain('Mini-Adhy');
    });
  });
});

