/**
 * ════════════════════════════════════════════════════════════════════
 *  UNIFIED REQUEST LIFECYCLE & COGNITIVE TASK PIPELINE
 * ════════════════════════════════════════════════════════════════════
 * Coordinates:
 * User Input → Intent Classification → Context Retrieval →
 * Identity Compilation → Task Mode Selection → Reasoning →
 * Optional Delegation → Permission Evaluation → Tool Execution →
 * Verification → Response Synthesis → Optional Memory Update
 * 
 * CORE PRINCIPLE:
 * Selective delegation. Level 1 simple queries are answered directly
 * without invoking multiple specialist agents or redundant LLM calls.
 */

import { identityCompiler } from '../identity/IdentityCompiler';
import { providerRegistry } from '../providers/ProviderRegistry';
import { permissionRegistry } from '../agents/PermissionRegistry';
import { memoryService } from '../memory/MemoryService';
import { cognitiveEvolutionEngine } from '../learning/CognitiveEvolutionEngine';
import { behaviouralController } from './BehaviouralController';

export const TASK_COMPLEXITY = Object.freeze({
  LEVEL_1_SIMPLE: 'LEVEL_1_SIMPLE',            // Direct conversation, standard query
  LEVEL_2_TECHNICAL: 'LEVEL_2_TECHNICAL',        // Technical reasoning, single specialist/model
  LEVEL_3_COMPLEX: 'LEVEL_3_COMPLEX',            // Multi-step planning, delegation, evaluation
  LEVEL_4_CONSEQUENTIAL: 'LEVEL_4_CONSEQUENTIAL' // State mutation, permissions, requires approval
});

export class RequestLifecycle {
  constructor() {
    this.activeRequests = new Map();
  }

  /**
   * Classify request complexity to prevent unnecessary computation
   */
  classifyComplexity(input = '', options = {}) {
    if (options.forceComplexity) return options.forceComplexity;

    const lower = input.toLowerCase().trim();

    // Level 4: Consequential actions (deployments, credential access, data wipe)
    if (
      lower.includes('delete') || lower.includes('purge') || 
      lower.includes('deploy to prod') || lower.includes('drop table') ||
      lower.includes('override security') || lower.includes('modify secrets')
    ) {
      return TASK_COMPLEXITY.LEVEL_4_CONSEQUENTIAL;
    }

    // Level 3: Complex architectural, multi-agent, or deep audit tasks
    if (
      lower.includes('full audit') || lower.includes('systemic review') ||
      lower.includes('multi-model consensus') || lower.includes('benchmark suite') ||
      (options.summonedAgents && options.summonedAgents.length > 1)
    ) {
      return TASK_COMPLEXITY.LEVEL_3_COMPLEX;
    }

    // Level 2: Technical hardware, DSP, code, or specific agent questions
    if (
      lower.includes('kicad') || lower.includes('pcb') || lower.includes('stm32') ||
      lower.includes('gnu radio') || lower.includes('dsp') || lower.includes('matlab') ||
      lower.includes('simulink') || lower.includes('circuit') || lower.includes('code') ||
      lower.includes('ultron') || lower.includes('jarvis') || lower.includes('friday')
    ) {
      return TASK_COMPLEXITY.LEVEL_2_TECHNICAL;
    }

    // Level 1: Default conversational or navigational queries
    return TASK_COMPLEXITY.LEVEL_1_SIMPLE;
  }

  /**
   * Primary entry point for executing user requests through the cognitive pipeline
   */
  async processRequest(rawInput = '', options = {}) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    const input = String(rawInput).trim();

    // Step 1: Complexity Classification
    const complexity = this.classifyComplexity(input, options);

    // Step 2: Intent & Behavioral Stance via Personal Understanding Engine
    const stance = behaviouralController.evaluateStance(input, {
      mode: options.mode,
      memoryLimit: 4
    });

    const mode = options.mode || stance.mode.id;
    const memoryContext = stance.relevantMemories || [];

    // Step 3: Selective Specialist Identification
    let specialistId = null;
    if (options.summonedAgents && options.summonedAgents.length === 1) {
      specialistId = options.summonedAgents[0];
    } else if (complexity === TASK_COMPLEXITY.LEVEL_2_TECHNICAL) {
      const lower = input.toLowerCase();
      if (lower.includes('ultron') || lower.includes('critique') || lower.includes('architectural flaw')) {
        specialistId = 'ULTRON';
      } else if (lower.includes('friday') || lower.includes('security') || lower.includes('defense')) {
        specialistId = 'FRIDAY';
      } else if (lower.includes('jarvis') || lower.includes('plan') || lower.includes('operations')) {
        specialistId = 'JARVIS';
      } else if (lower.includes('research') || lower.includes('isro') || lower.includes('paper')) {
        specialistId = 'EDITH';
      } else if (lower.includes('hardware test') || lower.includes('prototype')) {
        specialistId = 'DUM_E';
      }
    }

    // Step 4: Identity & Context Compilation
    const instructionPackage = identityCompiler.compileInstruction({
      mode,
      userInput: input,
      specialistAgentId: specialistId,
      memoryContext,
      allowTools: true,
      behaviouralStance: stance
    });

    // Step 5: Consequential Action Gate (Level 4 Assessment)
    if (complexity === TASK_COMPLEXITY.LEVEL_4_CONSEQUENTIAL) {
      const permCheck = permissionRegistry.evaluate('MINI_ADHY', 'consequential_user_action', { input });
      if (!permCheck.allowed) {
        return {
          requestId,
          complexity,
          mode,
          specialistId,
          text: `[Permission Boundary Active]: This action requires explicit owner authorization. Approval request #${permCheck.approvalId || 'pending'} queued.`,
          requiresApproval: true,
          approvalId: permCheck.approvalId,
          durationMs: Date.now() - startTime
        };
      }
    }

    // Step 6: Model Provider Execution with Bounded Fallback
    const providerRequirements = {};
    if (options.requiresVision) providerRequirements.requiresVision = true;
    if (complexity === TASK_COMPLEXITY.LEVEL_1_SIMPLE) providerRequirements.fastReflex = true;

    const requestPayload = {
      prompt: input,
      contents: options.history || [{ role: 'user', parts: [{ text: input }] }]
    };

    const generationResult = await providerRegistry.generateWithFallback(requestPayload, {
      systemPrompt: instructionPackage.systemPrompt,
      agentId: specialistId || 'MINI_ADHY',
      requirements: providerRequirements,
      timeoutMs: options.timeoutMs || 8000
    });

    const durationMs = Date.now() - startTime;
    const finalResponse = generationResult.text || this._resolveFallbackResponse(input, generationResult.error, specialistId);

    // Step 7: Continuous Memory Extraction & Controlled Evaluation Pipeline
    try {
      const candidateMemories = memoryService.extractCandidateObservations(input);
      candidateMemories.forEach(cand => {
        if (typeof memoryService.evaluateAndProcessCandidate === 'function') {
          memoryService.evaluateAndProcessCandidate(cand);
        } else {
          memoryService.storeRecord(cand);
        }
      });
    } catch {}

    // Step 8: Verifiable Telemetry Logging in CognitiveEvolutionEngine
    if (cognitiveEvolutionEngine?.recordTaskExecution) {
      cognitiveEvolutionEngine.recordTaskExecution({
        taskId: requestId,
        agentId: specialistId || 'MINI_ADHY',
        success: generationResult.success,
        durationMs,
        tokenCount: generationResult.tokenEstimate || 0,
        modelsUsed: generationResult.attemptedProviders || [generationResult.provider || 'gemini']
      });
    }

    return {
      requestId,
      complexity,
      mode,
      specialistId,
      text: finalResponse,
      provider: generationResult.provider,
      fallbackEngaged: generationResult.fallbackEngaged || false,
      durationMs
    };
  }

  /**
   * Deterministic local knowledge fallback when cloud providers are unreachable
   */
  _resolveFallbackResponse(input = '', errorMsg = '', specialistId = 'MINI_ADHY') {
    const lower = input.toLowerCase().trim();

    if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('who is mini-adhy')) {
      return "I'm Mini-Adhy, Adhithya Mohan's cognitive companion and digital twin. I represent his engineering, leadership, and creative workflows, bridging embedded systems, DSP, software architecture, and photography.";
    }

    if (lower.includes('who is adhy') || lower.includes('about adhy') || lower.includes('tell me about yourself') || lower.includes('bio')) {
      return "Adhithya Mohan S (Adhy) is an Electronics and Communication Engineering (ECE) student at Mar Baselios College of Engineering and Technology (MBCET, KTU). He currently serves as Media Secretary for the MBCET Senate and Lead Photographer for FRAMES MBCET, and was formerly Chairperson of ISTE Students Chapter MBCET. His technical core spans DSP, SDR, embedded systems (ARM/STM32), and autonomous agent systems.";
    }

    if (lower.includes('role') || lower.includes('senate') || lower.includes('iste') || lower.includes('frames') || lower.includes('leadership')) {
      return "Adhy's verified leadership roles include:\n• Current: Media Secretary, MBCET Senate\n• Current: Lead Photographer, FRAMES MBCET\n• Historical: Former Chairperson, ISTE Students Chapter MBCET (led 300+ student members)\n• Historical: Former PR & Media Head, ISTE Students Chapter MBCET";
    }

    if (lower.includes('project') || lower.includes('hardware') || lower.includes('stm32') || lower.includes('sdr') || lower.includes('dsp') || lower.includes('kicad')) {
      return "Adhy's active engineering projects span:\n• SDR & Digital Signal Processing (GNU Radio, RTL-SDR)\n• Embedded Systems & Firmware (STM32 ARM Cortex)\n• Multibody Dynamics & Simulation (MATLAB, Simulink, Simscape)\n• Hardware Design (KiCad 8 PCB layout)\n• Autonomous Agent Systems (the multi-agent cognitive architecture powering this portfolio)";
    }

    if (lower.includes('photo') || lower.includes('camera') || lower.includes('zoomout')) {
      return "Adhy is the Lead Photographer at FRAMES MBCET and curates street, documentary, and architectural photography under @zoomout_frames, exploring high-contrast visual storytelling and analog-inspired aesthetics.";
    }

    if (lower.includes('contact') || lower.includes('email') || lower.includes('reach') || lower.includes('message') || lower.includes('hire')) {
      return "You can get in touch with Adhy at adhithyamohan2312@gmail.com, or connect via LinkedIn and GitHub directly from the links on this portfolio.";
    }

    // Default polite offline fallback
    if (errorMsg) {
      return `I am currently operating in local offline mode as external cloud model providers are establishing connection (${errorMsg}). You can ask me anything about Adhy's engineering projects, leadership roles, photography, or skills!`;
    }

    return "I'm right here with you. What aspect of Adhy's work or projects shall we explore next?";
  }
}

export const requestLifecycle = new RequestLifecycle();

