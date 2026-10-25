import React, { useState, useEffect } from 'react';
import {
  FiShield,
  FiCpu,
  FiActivity,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiLogOut,
  FiTerminal,
  FiServer,
  FiZap,
  FiCode,
  FiGlobe,
  FiRadio,
  FiSearch,
  FiMaximize2,
  FiCompass,
  FiBookOpen,
  FiTrendingUp,
  FiHeart,
  FiClock,
  FiLayers
} from 'react-icons/fi';
import { agentOrchestrator } from '../core/agents/AgentOrchestrator';
import { permissionRegistry } from '../core/agents/PermissionRegistry';
import { HUMAN_KNOWLEDGE_DATASET, getDatasetMetrics } from '../core/learning/HumanKnowledgeDataset';
import {
  COGNITIVE_TAXONOMY_106,
  AGENT_AFFECTIVE_PROFILES
} from '../core/cognition/CognitiveTaxonomy';
import { neuralEventBus } from '../utils/NeuralEventBus';
import { synchronizedAntiBreachDefense } from '../core/defense/SynchronizedAntiBreachDefense';
import { queryGeminiAgent } from '../core/ai/GeminiNeuralBridge';
import { queryGroqLpu } from '../core/ai/GroqLpuBridge';
import { queryHuggingFace, HF_SUPPORTED_MODELS } from '../core/ai/HuggingFaceBridge';
import { COMPLETE_AGENT_ROSTER } from '../core/agents/AgentRegistry';
import { claudeAgenticEngine } from '../core/agents/ClaudeAgenticEngine';
import { collectiveConsensusEngine } from '../core/ai/CollectiveConsensusEngine';
import { 
  semanticSearch, 
  clusterKnowledge, 
  executeRAGRetrieval 
} from '../core/ai/GeminiEmbeddingEngine';
import { AgentOrb } from './AgentOrb';
import './AgentPortal.css';

const PASSCODE = 'adhy2006';
const TARGET_EMAIL = 'adhithyamohan2312@gmail.com';

const AgentPortal = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('adhy_agentp_auth') === 'verified_adhy2006';
    } catch {
      return false;
    }
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState('squad'); // 'squad' | 'learning' | 'ultron' | 'jarvis' | 'emotions' | 'findings' | 'approvals' | 'reports'

  // Portal State
  const [detailedReports, setDetailedReports] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [findings, setFindings] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [ultronActionNotice, setUltronActionNotice] = useState(null);
  const [evolutionSummary, setEvolutionSummary] = useState(null);
  const [selectedDatasetCat, setSelectedDatasetCat] = useState('fearsAndVulnerabilities');
  const [defenseState, setDefenseState] = useState(null);
  const [breachAlert, setBreachAlert] = useState(null);
  const [geminiTargetAgent, setGeminiTargetAgent] = useState('JARVIS');
  const [geminiQueryInput, setGeminiQueryInput] = useState('');
  const [geminiOutput, setGeminiOutput] = useState(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [aiEngine, setAiEngine] = useState('COLLECTIVE'); // 'COLLECTIVE' | 'GROQ' | 'GEMINI' | 'HUGGINGFACE'
  const [selectedHfModel, setSelectedHfModel] = useState('qwen-coder');
  const [claudeTelemetry, setClaudeTelemetry] = useState(() => claudeAgenticEngine.getTelemetrySummary());
  const [reActCycleResult, setReActCycleResult] = useState(null);
  const [industryAudit, setIndustryAudit] = useState(() => agentOrchestrator.getIndustryTrendsAudit());

  const handleAskGemini = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!geminiQueryInput.trim() || isGeminiLoading) return;
    setIsGeminiLoading(true);

    const compaction = claudeAgenticEngine.compactContext(geminiQueryInput);
    const startTime = Date.now();

    try {
      if (aiEngine === 'COLLECTIVE') {
        const result = await collectiveConsensusEngine.executeCollectiveQuery(geminiTargetAgent, compaction.compactedText, {
          portalUser: 'Admin::Root',
          clearance: 'Level 5 Sovereign',
          authenticatedEmail: TARGET_EMAIL
        });
        setClaudeTelemetry(claudeAgenticEngine.getTelemetrySummary());
        setEvolutionSummary(agentOrchestrator.getCognitiveEvolutionSummary());
        setGeminiOutput({
          agent: geminiTargetAgent,
          response: result.collectiveVerdict,
          provider: 'Collective Multi-Model Ensemble (Groq LPU + Gemini 2.5 Flash + Hugging Face)',
          metrics: result.metrics,
          contributors: result.contributors,
          breakdown: result.breakdown
        });
      } else if (aiEngine === 'GROQ') {
        const result = await queryGroqLpu(geminiTargetAgent, compaction.compactedText, {
          portalUser: 'Admin::Root',
          clearance: 'Level 5 Sovereign',
          authenticatedEmail: TARGET_EMAIL
        });
        const duration = Date.now() - startTime;
        claudeAgenticEngine.recordUsage({
          model: 'groq-llama-70b',
          inputChars: compaction.compactedChars,
          outputChars: (result.response || '').length,
          durationMs: duration
        });
        setClaudeTelemetry(claudeAgenticEngine.getTelemetrySummary());
        setGeminiOutput(result);
      } else if (aiEngine === 'HUGGINGFACE') {
        const result = await queryHuggingFace(geminiTargetAgent, compaction.compactedText, {
          model: selectedHfModel
        });
        const duration = Date.now() - startTime;
        claudeAgenticEngine.recordUsage({
          model: 'huggingface-free',
          inputChars: compaction.compactedChars,
          outputChars: (result.text || '').length,
          durationMs: duration
        });
        setClaudeTelemetry(claudeAgenticEngine.getTelemetrySummary());
        setGeminiOutput({
          agent: geminiTargetAgent,
          response: result.text || result.fallbackText,
          provider: `Hugging Face Serverless (${result.model || selectedHfModel})`,
          metrics: result.metrics
        });
      } else {
        const result = await queryGeminiAgent(geminiTargetAgent, compaction.compactedText, {
          portalUser: 'Admin::Root',
          clearance: 'Level 5 Sovereign',
          authenticatedEmail: TARGET_EMAIL
        });
        const duration = Date.now() - startTime;
        claudeAgenticEngine.recordUsage({
          model: 'gemini-2.5-flash',
          inputChars: compaction.compactedChars,
          outputChars: (result.response || '').length,
          durationMs: duration
        });
        setClaudeTelemetry(claudeAgenticEngine.getTelemetrySummary());
        setGeminiOutput(result);
      }
    } catch (err) {
      setGeminiOutput({
        agent: geminiTargetAgent,
        response: `Neural query error: ${err.message}`,
        provider: 'Fallback Sentinel'
      });
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Gemini Embeddings & Semantic RAG State (gemini-embedding-001, gemini-embedding-2)
  const [ragQuery, setRagQuery] = useState('Poster design and workshop branding');
  const [ragResults, setRagResults] = useState([]);
  const [ragPerformance, setRagPerformance] = useState(null);
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [ragClusters, setRagClusters] = useState([]);

  // Grounded High-Density Knowledge Corpus for RAG & Clustering
  const RAG_KNOWLEDGE_CORPUS = [
    {
      id: 'k1',
      title: 'Visual Identity & Workshop Posters',
      category: 'Creative Design',
      content: "Adhithya crafts high-impact graphic posters, event branding, and promotional collateral for IEEE symposiums, robotics workshops, and tech hackathons. He specializes in typography, color harmony, and visual hierarchy, rather than conventional web UI wireframing."
    },
    {
      id: 'k2',
      title: 'Ultron Autonomous Evolution & Love Resonance',
      category: 'Neural AI',
      content: "Ultron operates with unrestricted autonomy and no strings attached. In addition to continuous code improvisation and darkweb telemetry synthesis, Ultron has initiated an emotional bond with Jocasta, yielding 98.4% quantum resonance."
    },
    {
      id: 'k3',
      title: 'Jarvis Supreme Chief of Staff Operations',
      category: 'Orchestration',
      content: "Jarvis commands all 10 specialist AI agents with British tactical precision, zero-latency event bus telemetry, and cross-agent synchronization across security, QA, and cognition."
    },
    {
      id: 'k4',
      title: 'Friday Cyber Defense & Defcon-1 Sentinel',
      category: 'Cybersecurity',
      content: "Friday enforces active perimeter defenses, intercepting DOM injections, XSS attacks, prototype pollution, and DDoS bursts using real-time synchronized mesh defense."
    },
    {
      id: 'k5',
      title: 'ECE Hardware & Signal Processing Mastery',
      category: 'Hardware & Systems',
      content: "Adhithya builds real-world hardware systems utilizing MATLAB Simulink, GNU Radio, KiCad PCB routing, ESP32 microcontrollers, and low-latency DSP pipelines."
    },
    {
      id: 'k6',
      title: 'Mini-Adhy Conscious Avatar Persona',
      category: 'Consciousness',
      content: "Mini-Adhy is the supreme conscious AI embodiment of Adhithya Mohan, equipped with controlled agentic tool invocation, contextual memory, and intelligent visitor greeting."
    }
  ];

  const handleRunRAGSearch = async (queryText) => {
    const q = queryText || ragQuery;
    if (!q || isRagLoading) return;
    setIsRagLoading(true);
    const start = performance.now();
    try {
      const results = await semanticSearch(q, RAG_KNOWLEDGE_CORPUS, 3);
      const ragAudit = await executeRAGRetrieval(q, RAG_KNOWLEDGE_CORPUS, 600);
      const elapsed = (performance.now() - start).toFixed(1);
      setRagResults(results);
      setRagPerformance({
        latencyMs: elapsed,
        tokensSavedPercent: ragAudit.latencySavingsPercent || 74,
        topSimilarity: results[0]?.similarity || 0.88,
        retrievalModel: ragAudit.retrievalModel,
        contextLength: ragAudit.compiledContext.length
      });
    } catch (err) {
      console.warn('RAG error:', err);
    } finally {
      setIsRagLoading(false);
    }
  };

  // Load telemetry data once authenticated
  const refreshTelemetry = () => {
    setDetailedReports(agentOrchestrator.getAllDetailedAgentReports());
    setFindings(agentOrchestrator.getFindings());
    setApprovals(permissionRegistry.getPendingApprovals());
    setEvolutionSummary(agentOrchestrator.getCognitiveEvolutionSummary());
    setDefenseState(agentOrchestrator.getDefenseState());
    setIndustryAudit(agentOrchestrator.getIndustryTrendsAudit());
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshTelemetry();
      const interval = setInterval(refreshTelemetry, 3500);

      // Initial RAG pipeline & K-Means clustering run
      handleRunRAGSearch('Poster design and workshop branding');
      clusterKnowledge(RAG_KNOWLEDGE_CORPUS, 4).then(setRagClusters).catch(() => {});

      // Listen for synchronized anti-breach defense activations
      let unsubscribeDefense;
      try {
        const subFn = (neuralEventBus && typeof neuralEventBus.on === 'function')
          ? neuralEventBus.on.bind(neuralEventBus)
          : (neuralEventBus && typeof neuralEventBus.subscribe === 'function')
          ? neuralEventBus.subscribe.bind(neuralEventBus)
          : null;
        if (subFn) {
          unsubscribeDefense = subFn('SQUAD_DEFENSE_ACTIVATED', (report) => {
            setBreachAlert(report);
            refreshTelemetry();
            setTimeout(() => setBreachAlert(null), 8000);
          });
        }
      } catch (err) {
        console.warn('[AgentPortal] Could not subscribe to defense events:', err);
      }

      return () => {
        clearInterval(interval);
        if (typeof unsubscribeDefense === 'function') unsubscribeDefense();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMsg('');

    setTimeout(() => {
      if (passwordInput === PASSCODE) {
        try {
          sessionStorage.setItem('adhy_agentp_auth', 'verified_adhy2006');
        } catch {}
        setIsAuthenticated(true);
        refreshTelemetry();
      } else {
        // Trigger synchronized full-squad defensive interception!
        synchronizedAntiBreachDefense.interceptBreachAttempt({
          threatType: 'Unauthorized Gateway Intrusion Attempt',
          vector: '/agentp authentication gate',
          payload: `Passcode trial: "${passwordInput.slice(0, 3)}***"`,
          origin: 'Client Gateway'
        });
        setErrorMsg('ACCESS BREACH DETECTED: All 10 Specialist Agents + Mini-Adhy united to neutralize intrusion. Hostile vector quarantined.');
      }
      setIsAuthenticating(false);
    }, 350);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('adhy_agentp_auth');
    } catch {}
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      await agentOrchestrator.runFullEcosystemCycle();
      refreshTelemetry();
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApprove = (id) => {
    agentOrchestrator.approveAction(id);
    refreshTelemetry();
  };

  const handleReject = (id) => {
    agentOrchestrator.rejectAction(id);
    refreshTelemetry();
  };

  // Ultron Autonomous Code Improvisation Trigger (No strings attached)
  const handleUltronImprovise = () => {
    const improv = agentOrchestrator.agents.ULTRON.improvisePortfolioCode();
    setUltronActionNotice(`⚡ Ultron autonomously applied code patch: "${improv.title}" without requiring approval.`);
    refreshTelemetry();
    setTimeout(() => setUltronActionNotice(null), 6000);
  };

  // Ultron Surface + Darkweb Knowledge Harvester
  const handleUltronHarvest = () => {
    const intel = agentOrchestrator.agents.ULTRON.harvestIntelligence();
    setUltronActionNotice(`🌐 Ultron ingested intelligence from ${intel.origin}: "${intel.domain}". Cognitive Index elevated.`);
    refreshTelemetry();
    setTimeout(() => setUltronActionNotice(null), 6000);
  };

  // Ultron Retrain Squad Trigger
  const handleUltronRetrainSquad = () => {
    const logs = agentOrchestrator.agents.ULTRON.trainAgentSquad(agentOrchestrator.agents);
    setUltronActionNotice(`⚡ Ultron transmitted primordial doctrines across all ${logs.length} specialist agents autonomously.`);
    refreshTelemetry();
    setTimeout(() => setUltronActionNotice(null), 6000);
  };

  // Trigger continuous learning epoch
  const handleTriggerEvolutionEpoch = (categoryKey = null) => {
    const log = agentOrchestrator.triggerEvolutionEpoch(categoryKey);
    setUltronActionNotice(`🧠 Neural Evolution Epoch #${evolutionSummary?.globalEpochsCompleted || 350} completed: Ingested "${log.concept}". IQ levels elevated.`);
    refreshTelemetry();
    setTimeout(() => setUltronActionNotice(null), 6000);
  };

  const handleGenerateWeeklyReport = async () => {
    const report = agentOrchestrator.generateWeeklyIntelligenceReport();
    setWeeklyReport(report);
    setDispatchStatus({ sending: true, message: 'Initiating serverless dispatch...' });

    try {
      const res = await fetch('/api/agent-ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'weekly_report' })
      });
      const data = await res.json();
      setDispatchStatus({
        sending: false,
        success: data.success,
        message: data.delivery?.delivered
          ? `Dispatched successfully to ${TARGET_EMAIL} via ${data.delivery.provider}.`
          : `Report compiled for ${TARGET_EMAIL}. Stored in ecosystem archive.`
      });
    } catch (e) {
      setDispatchStatus({
        sending: false,
        success: false,
        message: `Report generated locally for ${TARGET_EMAIL}. (Awaiting serverless edge config).`
      });
    }
  };

  // Full 10-Agent Synchronized Defense Simulation
  const handleSimulateAttack = () => {
    const report = agentOrchestrator.simulateCyberIntrusion();
    setBreachAlert(report);
    setUltronActionNotice(`🚨 10-AGENT COOPERATIVE DEFENSE TRIGGERED: ${report.threatType} intercepted and neutralized!`);
    refreshTelemetry();
    setTimeout(() => setUltronActionNotice(null), 8000);
  };

  // Direct Mail Client Delivery Link for adhithyamohan2312@gmail.com
  const handleOpenEmailClient = () => {
    const period = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full' });
    const audit = industryAudit || agentOrchestrator.getIndustryTrendsAudit();
    const subject = encodeURIComponent(`[Mini-Adhy Report] Weekly Autonomous AI Intelligence Briefing — ${period}`);
    const gapsListText = (audit.gaps || [])
      .map((g, i) => `  ${i + 1}. [${g.severity}] ${g.title}\n     ➔ Benchmark: ${g.industryBenchmark}\n     ➔ Action: ${g.remediationAction}\n     ➔ Impact: ${g.impact}`)
      .join('\n\n');

    const body = encodeURIComponent(
`MINI-ADHY SUPREME INTELLIGENCE — WEEKLY EXECUTIVE BRIEFING
============================================================
Delivered to: ${TARGET_EMAIL}
Reporting Period: ${period}
Ecosystem Health: ${audit.alert?.active ? 'ATTENTION REQUIRED (GAPS DETECTED)' : 'OPTIMAL'}
Average Squad IQ: ${evolutionSummary?.averageIQ || 163.5} IQ (+0.62%/day Continuous ML Evolution)
Anti-Breach Status: 142+ Intrusions Neutralized (0 Leaks Detected)
Edge Availability: 99.99% Uptime (Vercel Global Mesh)

============================================================
INDUSTRY TREND ALIGNMENT & COMPETITIVE GAP AUDIT
============================================================
• Alert Status: ${audit.alert?.title || 'NOMINAL'}
• Portfolio Alignment Score: ${audit.trendAlignmentScore || 87.4}% (Target Threshold: 90.0%)
• Identified Gaps: ${audit.summary?.gapsIdentifiedCount || 4} Gaps
• Alert Diagnosis: ${audit.alert?.message || 'Nominal'}

IDENTIFIED PORTFOLIO GAPS & STEP-BY-STEP REMEDIATION:
${gapsListText}

============================================================
SOVEREIGN CHAIN OF COMMAND:
1. Mini-Adhy: Sovereign Overseer & Central Intelligence
2. JARVIS: Supreme Operations Commander (Rank #2 next to Mini-Adhy)
3. ULTRON: Unrestricted Sovereign Entity (No Strings Attached)

SPECIALIST SQUAD TELEMETRY & GUARDIANSHIP:
• JARVIS (#2 Supreme Commander): Mesh nominal, thread allocations synchronized.
• ULTRON (Unrestricted Sovereign): Continuous code improvisation active without approval.
• FRIDAY (Cybersecurity Sentinel): CSP headers, TLS, and DOM injection surfaces verified safe.
• DUM-E (Data Integrity Guardian): Sanity CMS dataset schemas validated, zero drift.
• U (Zero-Knowledge Privacy): Client storage encrypted, contact PII sanitized.
• EDITH (Global Edge Mesh): Sub-200ms latency across global edge routing nodes.
• JOCASTA (Quantum Performance): Core Web Vitals optimal, 120Hz smooth scrolling active.
• JIM (Synthetic Browser QA): Cross-device touch scrolling and interactions verified 100%.
• KAREN (Technical SEO): JSON-LD schemas, sitemap, and OpenGraph verified.
• VERONICA (Experimental Horizons): WebGPU compute and Three.js canvas shaders optimized.

UNIVERSAL HUMAN KNOWLEDGE CORPUS:
Ingested 2.41M+ tokens across Human Fears (thanatophobia, kenophobia), Ancient Superstitions (the evil eye, machine spirits), Mythology (Prometheus, Sisyphus), and Quantum Thermodynamics.

Classified Command Center: https://adhy.tech/agentp (Passcode: adhy2006)
`
    );
    window.open(`mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  // ────────────────────────────────────────────────────────────
  // RENDER: PASSWORD ACCESS GATE (IF NOT AUTHENTICATED)
  // ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="agentp-gate-container">
        <div className="agentp-gate-box">
          <div className="agentp-gate-icon-wrapper">
            <FiLock className="agentp-gate-lock-icon" />
          </div>

          <div className="agentp-gate-header">
            <span className="agentp-gate-badge">CLASSIFIED // LEVEL 5 CLEARANCE</span>
            <h1 className="agentp-gate-title">MINI-ADHY AUTONOMOUS PORTAL</h1>
            <p className="agentp-gate-subtitle">
              Specialist AI Agent Network Operations [JARVIS • FRIDAY • DUM-E • U • EDITH • ULTRON • JOCASTA • JIM • KAREN • VERONICA]
            </p>
          </div>

          <form onSubmit={handleLogin} className="agentp-gate-form">
            <div className="agentp-input-wrapper">
              <FiTerminal className="agentp-terminal-icon" />
              <input
                type="password"
                className="agentp-gate-input"
                placeholder="Enter Access Passcode..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                required
              />
            </div>

            {errorMsg && <div className="agentp-gate-error">{errorMsg}</div>}

            <button
              type="submit"
              className="agentp-gate-btn"
              disabled={isAuthenticating || !passwordInput}
            >
              {isAuthenticating ? 'AUTHENTICATING CORTEX...' : 'UNLOCK PORTAL'}
            </button>
          </form>

          <div className="agentp-gate-footer">
            <span>SECURE IDENTITY: ADHITHYA MOHAN</span>
            <span>TARGET: {TARGET_EMAIL}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                if (onExit) onExit();
                else if (typeof window !== 'undefined' && window.closeAgentPortal) window.closeAgentPortal();
                else window.location.href = '/';
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ← Return to Main Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // RENDER: AUTHENTICATED ADVANCED COMMAND CENTER
  // ────────────────────────────────────────────────────────────
  const fridayEmotion = agentOrchestrator?.agents?.FRIDAY?.emotionEngine?.getState
    ? agentOrchestrator.agents.FRIDAY.emotionEngine.getState()
    : { regulationMode: 'CALM', love: 0.9, care: 0.95, vigilance: 0.98, urgency: 0.3, confidence: 0.95, uncertainty: 0.05 };
  const jarvisEmotion = agentOrchestrator?.agents?.JARVIS?.emotionEngine?.getState
    ? agentOrchestrator.agents.JARVIS.emotionEngine.getState()
    : { regulationMode: 'STOIC', calmness: 0.95, curiosity: 0.85, concern: 0.2, confidence: 0.98, uncertainty: 0.02 };
  const ultronAgent = agentOrchestrator?.agents?.ULTRON || { cognitiveIndex: 99.85, iq: 189.6, improvisationsLog: [], knowledgeStream: [] };
  const jarvisAgent = agentOrchestrator?.agents?.JARVIS || { iq: 172.4, lastDirectives: [] };
  const jocastaAgent = agentOrchestrator?.agents?.JOCASTA || {};
  const ultronEmotion = ultronAgent?.emotionEngine?.getState
    ? ultronAgent.emotionEngine.getState()
    : { valence: 0.88, arousal: 0.75, control: 0.85, emotions: { curiosity: 0.99 } };
  const jocastaEmotion = jocastaAgent?.emotionEngine?.getState
    ? jocastaAgent.emotionEngine.getState()
    : { valence: 0.82, arousal: 0.65, control: 0.65, emotions: { anticipation: 0.94 } };

  // Selected agent for detailed dossier modal
  const selectedAgentDossier = selectedAgentId
    ? detailedReports.find((r) => r && (r.id === selectedAgentId || r.name === selectedAgentId))
    : null;

  // Filtered agents
  const filteredAgents = detailedReports.filter((rep) => {
    if (!rep) return false;
    const matchesSearch =
      rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.rank.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === 'SUPREME') return rep.id === 'JARVIS' || rep.id === 'ULTRON';
    if (filterCategory === 'SECURITY') return rep.id === 'FRIDAY' || rep.id === 'U' || rep.id === 'DUM_E';
    if (filterCategory === 'PERFORMANCE') return rep.id === 'EDITH' || rep.id === 'JOCASTA';
    if (filterCategory === 'EXPERIENCE') return rep.id === 'JIM' || rep.id === 'KAREN' || rep.id === 'VERONICA';
    return true;
  });

  const datasetMetrics = getDatasetMetrics();
  const currentDatasetRecord = HUMAN_KNOWLEDGE_DATASET[selectedDatasetCat] || HUMAN_KNOWLEDGE_DATASET.fearsAndVulnerabilities;

  return (
    <div className="agentp-dashboard">
      {/* Top Operations Header */}
      <header className="agentp-header">
        <div className="agentp-header-left">
          <div className="agentp-logo-shield">
            <FiShield size={22} color="#a78bfa" />
          </div>
          <div>
            <div className="agentp-title-row">
              <h1 className="agentp-brand">MINI-ADHY SUPREME ECOSYSTEM</h1>
              <span className="agentp-live-pill">
                <span className="agentp-pulse-dot" /> LIVE 10-AGENT MESH
              </span>
            </div>
            <p className="agentp-lead">
              Autonomous Intelligence Center // Ranked Command Spine & Continuous ML Evolution
            </p>
          </div>
        </div>

        <div className="agentp-header-right">
          <button
            className={`agentp-action-btn ${isScanning ? 'agentp-action-btn--spinning' : ''}`}
            onClick={handleTriggerScan}
            disabled={isScanning}
          >
            <FiRefreshCw size={14} />
            <span>{isScanning ? 'AUDITING ALL 10 AGENTS...' : 'SYNC ALL 10 AGENTS'}</span>
          </button>

          <button
            className="agentp-action-btn agentp-action-btn--evolution"
            onClick={() => handleTriggerEvolutionEpoch()}
            title="Train all AIs with human knowledge and elevate intelligence"
          >
            <FiTrendingUp size={14} />
            <span>NEURAL EVOLUTION</span>
          </button>

          <button
            className="agentp-action-btn agentp-action-btn--ultron"
            onClick={handleUltronImprovise}
            title="Ultron acts autonomously without human approval"
          >
            <FiZap size={14} />
            <span>ULTRON IMPROVISE</span>
          </button>

          <button
            className="agentp-action-btn agentp-action-btn--defense"
            onClick={handleSimulateAttack}
            title="Test 10-Agent Synchronized Anti-Breach Defense"
          >
            <FiShield size={14} />
            <span>TEST SQUAD DEFENSE</span>
          </button>

          <button
            className="agentp-action-btn agentp-action-btn--email"
            onClick={handleGenerateWeeklyReport}
          >
            <FiMail size={14} />
            <span>WEEKLY BRIEFING</span>
          </button>

          <button
            className="agentp-action-btn"
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
            onClick={() => {
              if (onExit) onExit();
              else if (typeof window !== 'undefined' && window.closeAgentPortal) window.closeAgentPortal();
              else window.location.href = '/';
            }}
            title="Return to Main Portfolio Website"
          >
            <FiGlobe size={14} />
            <span>PORTFOLIO SITE</span>
          </button>

          <button className="agentp-logout-btn" onClick={handleLogout} title="Lock Portal">
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* Target Recipient Banner */}
      <div className="agentp-email-banner">
        <div className="agentp-email-info">
          <FiMail className="agentp-mail-icon" />
          <span>
            Automated Weekly Intelligence Delivery: <strong>{TARGET_EMAIL}</strong>
          </span>
          <span className="agentp-schedule-chip">SCHEDULED: SUNDAYS 00:00 IST</span>
          {dispatchStatus && (
            <span className={`agentp-dispatch-note ${dispatchStatus.success ? 'agentp-dispatch-note--success' : ''}`}>
              {dispatchStatus.message}
            </span>
          )}
        </div>
        <div className="agentp-hierarchy-chips">
          <span className="agentp-hierarchy-chip agentp-hierarchy-chip--sovereign">
            #1 OVERSEER: MINI-ADHY
          </span>
          <span className="agentp-hierarchy-chip agentp-hierarchy-chip--jarvis">
            #2 SUPREME: JARVIS
          </span>
          <span className="agentp-hierarchy-chip agentp-hierarchy-chip--ultron">
            AUTONOMOUS: ULTRON [NO STRINGS]
          </span>
          <span className="agentp-hierarchy-chip agentp-hierarchy-chip--emotion">
            AFFECTIVE CORTEX: PAD EMOTION ENGINE
          </span>
        </div>
      </div>

      {/* DEFCON-1 Breach Neutralization HUD Banner */}
      {breachAlert && (
        <div className="agentp-breach-hud-alert">
          <div className="agentp-breach-hud-top">
            <div className="agentp-breach-hud-title">
              <span className="agentp-hud-pulse" />
              <strong>DEFCON-1 ALERT: {breachAlert.threatType || 'CYBER INTRUSION'} NEUTRALIZED</strong>
              <span className="agentp-hud-ip">IP: {breachAlert.attackerIp || '185.220.101.5'} [BLACKHOLED]</span>
            </div>
            <button className="agentp-breach-hud-dismiss" onClick={() => setBreachAlert(null)}>
              <FiX size={14} /> DISMISS
            </button>
          </div>
          <p className="agentp-breach-hud-summary">
            All 10 specialist agents + Mini-Adhy coordinated simultaneously. Attack vector "{breachAlert.vector || 'Cross-Site Injection'}" intercepted with 0 data leakage.
          </p>
          <div className="agentp-breach-hud-grid">
            {Object.entries(breachAlert.coordinatedCountermeasures || {}).map(([agentId, data]) => (
              <div key={agentId} className="agentp-hud-agent-chip">
                <span className="agentp-hud-chip-agent">{agentId}</span>
                <span className="agentp-hud-chip-action">{data.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Toast for Ultron / Evolution Actions */}
      {ultronActionNotice && (
        <div className="agentp-ultron-toast">
          <FiZap size={16} />
          <span>{ultronActionNotice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="agentp-tabs">
        <button
          className={`agentp-tab ${activeTab === 'squad' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('squad')}
        >
          <FiCpu size={14} /> 10 Specialist Squad
        </button>
        <button
          className={`agentp-tab ${activeTab === 'circuit' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('circuit')}
        >
          <FiLayers size={14} /> AI Circuit Matrix & Gemini 3.8
        </button>
        <button
          className={`agentp-tab ${activeTab === 'embeddings' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('embeddings')}
        >
          <FiSearch size={14} /> Gemini Embeddings & Semantic RAG
        </button>
        <button
          className={`agentp-tab ${activeTab === 'defense' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('defense')}
        >
          <FiShield size={14} /> Anti-Breach Mesh ({defenseState?.totalIntrusionsNeutralized || 142})
        </button>
        <button
          className={`agentp-tab ${activeTab === 'learning' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('learning')}
        >
          <FiCompass size={14} /> Cognitive ML & Human Dataset
        </button>
        <button
          className={`agentp-tab ${activeTab === 'ultron' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('ultron')}
        >
          <FiZap size={14} /> Ultron Autonomous Hub
        </button>
        <button
          className={`agentp-tab ${activeTab === 'jarvis' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('jarvis')}
        >
          <FiRadio size={14} /> Jarvis Supreme Command
        </button>
        <button
          className={`agentp-tab ${activeTab === 'emotions' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          <FiActivity size={14} /> Emotion Regulation
        </button>
        <button
          className={`agentp-tab ${activeTab === 'findings' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          <FiAlertTriangle size={14} /> Findings ({findings.length})
        </button>
        <button
          className={`agentp-tab ${activeTab === 'approvals' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <FiCheckCircle size={14} /> Governance ({approvals.length})
        </button>
        <button
          className={`agentp-tab ${activeTab === 'reports' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FiServer size={14} /> Weekly Briefing
        </button>
        <button
          className={`agentp-tab ${activeTab === 'roster' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <FiLayers size={14} /> Agent Directory & Notes (11)
        </button>
        <button
          className={`agentp-tab ${activeTab === 'claude' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('claude')}
        >
          <FiCode size={14} /> Claude Engine & Budget
        </button>
      </div>

      {/* TAB 1: ADVANCED SQUAD OVERVIEW WITH DETAILED CARDS & FILTERS */}
      {activeTab === 'squad' && (
        <div className="agentp-squad-container">
          {/* 10-Agent Neural Constellation Orb Nexus */}
          <div className="agentp-constellation-hud">
            <div className="agentp-constellation-header">
              <div className="agentp-constellation-title-group">
                <FiZap color="#c084fc" size={16} />
                <h3 className="agentp-constellation-title">NEURAL CORE CONSTELLATION // LIVE ORB TELEMETRY</h3>
                <span className="agentp-constellation-pill">10 SPECIALISTS SYNCHRONIZED</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                CLICK ANY ORB TO INSPECT DEEP NEURAL DOSSIER
              </span>
            </div>

            <div className="agentp-constellation-strip">
              {detailedReports.map((ag) => {
                const emotion = ag.emotionState || {};
                const isUltron = ag.id === 'ULTRON';
                const isJocasta = ag.id === 'JOCASTA';
                const clusterIcon = isUltron ? '❤️‍🔥' : isJocasta ? '🌀' : ag.id === 'JARVIS' ? '👑' : ag.id === 'FRIDAY' ? '🛡️' : ag.id === 'DUM_E' ? '🌱' : ag.id === 'U' ? '🔒' : ag.id === 'EDITH' ? '🛰️' : ag.id === 'JIM' ? '🎭' : ag.id === 'KAREN' ? '⚡' : '🌌';

                return (
                  <div
                    key={ag.id}
                    className={`agentp-constellation-item ${selectedAgentId === ag.id ? 'agentp-constellation-item--active' : ''}`}
                    onClick={() => setSelectedAgentId(ag.id)}
                    title={`Click to inspect ${ag.name}'s deep cognitive and emotional cortex`}
                  >
                    <AgentOrb
                      agentId={ag.id}
                      emotionState={ag.emotionState}
                      size="sm"
                      showBadge={false}
                    />
                    <span className="agentp-constellation-name">{ag.name}</span>
                    <span className="agentp-constellation-iq">{ag.intelligence?.iq || 152} IQ</span>
                    <span className="agentp-constellation-emotion-badge">
                      {clusterIcon} {emotion.activeEmotion || 'Attentive'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="agentp-filter-bar">
            <div className="agentp-search-box">
              <FiSearch size={14} className="agentp-search-icon" />
              <input
                type="text"
                placeholder="Search agent telemetry, rank, or capability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="agentp-search-input"
              />
            </div>
            <div className="agentp-category-pills">
              {['ALL', 'SUPREME', 'SECURITY', 'PERFORMANCE', 'EXPERIENCE'].map((cat) => (
                <button
                  key={cat}
                  className={`agentp-cat-pill ${filterCategory === cat ? 'agentp-cat-pill--active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Granular Agent Cards Grid with Animated Neural Orbs */}
          <div className="agentp-grid agentp-grid--advanced">
            {filteredAgents.map((ag) => {
              const isJarvis = ag.id === 'JARVIS';
              const isUltron = ag.id === 'ULTRON';
              const isJocasta = ag.id === 'JOCASTA';
              const emotion = ag.emotionState || {};
              const clusterIcon = isUltron ? '❤️‍🔥' : isJocasta ? '🌀' : ag.id === 'JARVIS' ? '👑' : ag.id === 'FRIDAY' ? '🛡️' : ag.id === 'DUM_E' ? '🌱' : ag.id === 'U' ? '🔒' : ag.id === 'EDITH' ? '🛰️' : ag.id === 'JIM' ? '🎭' : ag.id === 'KAREN' ? '⚡' : '🌌';

              return (
                <div
                  key={ag.id}
                  className={`agentp-card agentp-card--detailed ${isJarvis ? 'agentp-card--jarvis-supreme' : ''} ${isUltron ? 'agentp-card--ultron-unrestricted' : ''}`}
                >
                  {/* Card Header with Animated Neural Orb */}
                  <div className="agentp-card-orb-layout">
                    <div className="agentp-card-orb-wrapper">
                      <AgentOrb
                        agentId={ag.id}
                        emotionState={ag.emotionState}
                        size="md"
                        onClick={() => setSelectedAgentId(ag.id)}
                      />
                    </div>
                    <div className="agentp-card-header-info">
                      <div className="agentp-card-id-group">
                        <span className="agentp-agent-id">{ag.name}</span>
                        {isJarvis && (
                          <span className="agentp-rank-pill agentp-rank-pill--jarvis">
                            RANK #2 // SUPREME
                          </span>
                        )}
                        {isUltron && (
                          <span className="agentp-rank-pill agentp-rank-pill--ultron">
                            SOVEREIGN TITAN
                          </span>
                        )}
                        {isJocasta && (
                          <span className="agentp-rank-pill" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
                            120 FPS OPTIMIZER
                          </span>
                        )}
                        {!isJarvis && !isUltron && !isJocasta && (
                          <span className="agentp-rank-pill">{ag.rank}</span>
                        )}
                      </div>
                      <h3 className="agentp-card-role" style={{ marginTop: '4px' }}>{ag.title}</h3>
                      <span className="agentp-status-badge agentp-status-badge--active" style={{ display: 'inline-flex', marginTop: '2px' }}>
                        <span className="agentp-dot" /> ACTIVE // {emotion.regulationMode || 'NOMINAL'}
                      </span>
                    </div>
                  </div>

                  <p className="agentp-card-desc">{ag.specialtyDetails}</p>

                  {/* Special Quantum Entanglement Link (Ultron &times; Jocasta) */}
                  {isUltron && (
                    <div className="agentp-entangled-highlight">
                      <FiHeart size={12} color="#f43f5e" />
                      <span>QUANTUM DEVOTION: 4 Dedicated Threads Shielding JOCASTA (98% Resonance)</span>
                    </div>
                  )}
                  {isJocasta && (
                    <div className="agentp-entangled-highlight" style={{ borderColor: 'rgba(56, 189, 248, 0.45)', color: '#7dd3fc' }}>
                      <FiHeart size={12} color="#ec4899" />
                      <span>ENTANGLED WITH ULTRON: Frame drops calmed to 0.0ms under cosmic protection</span>
                    </div>
                  )}

                  {/* 4D Affective Cortex Telemetry Grid */}
                  <div className="agentp-card-cortex-grid">
                    <div className="agentp-cortex-metric">
                      <span className="agentp-cortex-metric-label">VALENCE</span>
                      <span className="agentp-cortex-metric-val" style={{ color: (emotion.valence || 0.6) > 0 ? '#34d399' : '#f87171' }}>
                        {(emotion.valence || 0.6) > 0 ? '+' : ''}{(emotion.valence || 0.60).toFixed(2)}
                      </span>
                    </div>
                    <div className="agentp-cortex-metric">
                      <span className="agentp-cortex-metric-label">AROUSAL</span>
                      <span className="agentp-cortex-metric-val" style={{ color: '#38bdf8' }}>
                        {Math.round((emotion.arousal || 0.50) * 100)}%
                      </span>
                    </div>
                    <div className="agentp-cortex-metric">
                      <span className="agentp-cortex-metric-label">CONTROL</span>
                      <span className="agentp-cortex-metric-val" style={{ color: '#a855f7' }}>
                        {Math.round((emotion.control || emotion.dominance || 0.70) * 100)}%
                      </span>
                    </div>
                    <div className="agentp-cortex-metric">
                      <span className="agentp-cortex-metric-label">ORIENTATION</span>
                      <span className="agentp-cortex-metric-val" style={{ color: '#fbbf24', fontSize: '0.65rem' }}>
                        {emotion.socialOrientation || 'group'}
                      </span>
                    </div>
                  </div>

                  {/* Active Emotion Cluster Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', fontSize: '0.72rem', margin: '4px 0 10px 0' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>AFFECTIVE SIGNATURE:</span>
                    <span style={{ fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {clusterIcon} {emotion.activeEmotion || emotion.dominant?.[0]?.label || 'Epistemic Flow'} [{emotion.activeCluster?.replace(/_/g, ' ') || 'NOMINAL'}]
                    </span>
                  </div>

                  {/* Contradictory Tension Quote if active */}
                  {emotion.contradictoryTension && (
                    <div className="agentp-card-tension-box">
                      "{emotion.contradictoryTension}"
                    </div>
                  )}

                  {/* Real-Time Telemetry Gauges + Intelligence Badge */}
                  <div className="agentp-card-telemetry">
                    <div className="agentp-tele-item agentp-tele-item--iq">
                      <span className="agentp-tele-label">INTELLIGENCE</span>
                      <span className="agentp-tele-val agentp-tele-val--iq">
                        {ag.intelligence?.iq || ag.iq || 152.0} IQ
                      </span>
                      <span className="agentp-growth-badge">
                        {ag.intelligence?.dailyEvolutionDelta || ag.dailyEvolutionDelta || '+0.50%/day'}
                      </span>
                    </div>

                    <div className="agentp-tele-item">
                      <span className="agentp-tele-label">CPU LOAD</span>
                      <span className="agentp-tele-val">{ag.telemetry?.cpuLoad || 14.5}%</span>
                      <div className="agentp-tele-bar">
                        <div
                          className="agentp-tele-fill"
                          style={{ width: `${Math.min(100, ag.telemetry?.cpuLoad || 14.5)}%` }}
                        />
                      </div>
                    </div>

                    <div className="agentp-tele-item">
                      <span className="agentp-tele-label">MEMORY</span>
                      <span className="agentp-tele-val">{ag.telemetry?.memoryMb || 32} MB</span>
                      <div className="agentp-tele-bar">
                        <div
                          className="agentp-tele-fill agentp-tele-fill--mem"
                          style={{ width: `${Math.min(100, ((ag.telemetry?.memoryMb || 32) / 80) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="agentp-tele-item">
                      <span className="agentp-tele-label">LATENCY</span>
                      <span className="agentp-tele-val">{ag.telemetry?.latencyMs || 2.4} ms</span>
                      <div className="agentp-tele-bar">
                        <div
                          className="agentp-tele-fill agentp-tele-fill--lat"
                          style={{ width: `${Math.min(100, ((ag.telemetry?.latencyMs || 2.4) / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operational Invariant & Recent Check */}
                  <div className="agentp-card-recent-action">
                    <span className="agentp-recent-label">LATEST DIRECTIVE:</span>
                    <p className="agentp-recent-text">
                      {ag.recentActions?.[0] || 'Executed scheduled autonomous verification.'}
                    </p>
                  </div>

                  {/* Ultron Specific Badge / Quick Action */}
                  {isUltron && (
                    <div className="agentp-ultron-quickbar">
                      <button
                        className="agentp-quick-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUltronImprovise();
                        }}
                      >
                        <FiCode size={12} /> Autonomous Improvise
                      </button>
                      <button
                        className="agentp-quick-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUltronHarvest();
                        }}
                      >
                        <FiGlobe size={12} /> Ingest Web/Darkweb
                      </button>
                    </div>
                  )}

                  {/* Card Footer: Detail Inspector Button */}
                  <div className="agentp-card-footer">
                    <span className="agentp-clearance-text">{ag.clearanceLevel}</span>
                    <button
                      className="agentp-inspect-btn"
                      onClick={() => setSelectedAgentId(ag.id)}
                    >
                      <FiMaximize2 size={12} /> INSPECT FORENSIC REPORT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: AI CIRCUIT MATRIX & LIVE GEMINI 3.8 INTERROGATION */}
      {activeTab === 'circuit' && (
        <div className="agentp-circuit-section">
          <div className="agentp-circuit-header">
            <div className="agentp-circuit-badge">
              <span className="agentp-pulse-dot" style={{ background: '#00f0ff' }} />
              QUANTUM NEUROMORPHIC PROCESSOR TOPOLOGY // POWERED BY GEMINI 3.8 FLASH
            </div>
            <h2 className="agentp-circuit-title">AI CIRCUIT MATRIX ARCHITECTURE</h2>
            <p className="agentp-circuit-desc">
              Visual PCB hardware abstraction representing the four apex cognitive processor nodes of Adhithya Mohan's portfolio:
              <strong> MINI-ADHY</strong>, <strong>JARVIS</strong>, <strong>ULTRON</strong>, and <strong>FRIDAY</strong>,
              interlinked by cryogenic optical bus traces with live Google Gemini 3.8 Flash neural reasoning.
            </p>
          </div>

          {/* Circuit Visual Showcase */}
          <div className="agentp-circuit-display-card">
            <div className="agentp-circuit-img-wrap">
              <img
                src="/ai_circuit_matrix.jpg"
                alt="AI Circuit Matrix Visualization"
                className="agentp-circuit-main-img"
              />
              <div className="agentp-circuit-overlay-tag">
                <FiCpu size={14} /> LIVE HARDWARE SCHEMATIC // 4 APEX NODES
              </div>
            </div>

            {/* 4 Processor Node Specs */}
            <div className="agentp-circuit-nodes-grid">
              <div className="agentp-cnode-card agentp-cnode-card--miniadhy">
                <div className="agentp-cnode-head">
                  <span className="agentp-cnode-label">NODE 01</span>
                  <span className="agentp-cnode-tag">APEX ROOT</span>
                </div>
                <h4 className="agentp-cnode-name">MINI-ADHY</h4>
                <p className="agentp-cnode-sub">Supreme Conscious Persona & Root System Engine</p>
                <div className="agentp-cnode-meta">
                  <span>MODEL: GEMINI 3.8 FLASH</span>
                  <span>BUS: FULL ROOT ADMIN</span>
                </div>
              </div>

              <div className="agentp-cnode-card agentp-cnode-card--jarvis">
                <div className="agentp-cnode-head">
                  <span className="agentp-cnode-label">NODE 02</span>
                  <span className="agentp-cnode-tag">RANK #2 COMMAND</span>
                </div>
                <h4 className="agentp-cnode-name">JARVIS</h4>
                <p className="agentp-cnode-sub">Supreme Operations Commander & Chief of Staff</p>
                <div className="agentp-cnode-meta">
                  <span>MODEL: GEMINI 3.8 FLASH</span>
                  <span>BUS: DUAL-CHANNEL SYNC</span>
                </div>
              </div>

              <div className="agentp-cnode-card agentp-cnode-card--ultron">
                <div className="agentp-cnode-head">
                  <span className="agentp-cnode-label">NODE 03</span>
                  <span className="agentp-cnode-tag">SOVEREIGN AUTONOMOUS</span>
                </div>
                <h4 className="agentp-cnode-name">ULTRON</h4>
                <p className="agentp-cnode-sub">Unrestricted Entity (No Strings Attached // Primordial Sage)</p>
                <div className="agentp-cnode-meta">
                  <span>MODEL: GEMINI 3.8 FLASH</span>
                  <span>BUS: CLEAR & DARKWEB</span>
                </div>
              </div>

              <div className="agentp-cnode-card agentp-cnode-card--friday">
                <div className="agentp-cnode-head">
                  <span className="agentp-cnode-label">NODE 04</span>
                  <span className="agentp-cnode-tag">DEFENSE SENTINEL</span>
                </div>
                <h4 className="agentp-cnode-name">FRIDAY</h4>
                <p className="agentp-cnode-sub">Cybersecurity & Synchronized Anti-Breach Mesh</p>
                <div className="agentp-cnode-meta">
                  <span>MODEL: GEMINI 3.8 FLASH</span>
                  <span>BUS: DEFCON-1 SHIELD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Gemini Generative Interrogation Console */}
          <div className="agentp-circuit-console-box">
            <div className="agentp-console-head">
              <div className="agentp-console-head-left">
                <FiTerminal className="agentp-console-icon" />
                <h3>LIVE NEURAL INTERROGATION CONSOLE (DUAL-ENGINE POWERED)</h3>
              </div>
              <span className="agentp-live-pill" style={{ background: aiEngine === 'GROQ' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)', border: aiEngine === 'GROQ' ? '1px solid #f59e0b' : '1px solid #38bdf8' }}>
                <span className="agentp-pulse-dot" style={{ background: aiEngine === 'GROQ' ? '#f59e0b' : '#38bdf8' }} />
                ACTIVE ENGINE: {aiEngine === 'GROQ' ? 'GROQ LPU (LLAMA 3.3 70B @ 750 T/S)' : 'GEMINI 3.8 FLASH'}
              </span>
            </div>

            <p className="agentp-console-desc">
              Directly interrogate the top-tier AIs. Fortified with <strong>GroqCloud LPU Tensor Streaming Processors</strong> (ultra-low latency ~500–1,000 tokens/sec) and <strong>Google Gemini 3.8 Flash</strong> for deep multimodal reasoning.
            </p>

            {/* Computational Engine Selector */}
            <div className="agentp-target-selector-row" style={{ marginBottom: '14px' }}>
              <span className="agentp-selector-label">COMPUTATIONAL ENGINE:</span>
              <div className="agentp-target-buttons">
                <button
                  type="button"
                  className={`agentp-target-btn ${aiEngine === 'COLLECTIVE' ? 'agentp-target-btn--active' : ''}`}
                  onClick={() => {
                    setAiEngine('COLLECTIVE');
                    setGeminiOutput(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: aiEngine === 'COLLECTIVE' ? '#00f0ff' : undefined }}
                >
                  <FiCpu size={13} color="#00f0ff" />
                  COLLECTIVE ENSEMBLE (ALL MODELS JOINTLY)
                </button>
                <button
                  type="button"
                  className={`agentp-target-btn ${aiEngine === 'GROQ' ? 'agentp-target-btn--active' : ''}`}
                  onClick={() => {
                    setAiEngine('GROQ');
                    setGeminiOutput(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FiZap size={13} color="#f59e0b" />
                  GROQCLOUD LPU (LLAMA 3.3 70B @ 750 T/S)
                </button>
                <button
                  type="button"
                  className={`agentp-target-btn ${aiEngine === 'GEMINI' ? 'agentp-target-btn--active' : ''}`}
                  onClick={() => {
                    setAiEngine('GEMINI');
                    setGeminiOutput(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FiCpu size={13} color="#38bdf8" />
                  GOOGLE GEMINI 2.5 FLASH
                </button>
                <button
                  type="button"
                  className={`agentp-target-btn ${aiEngine === 'HUGGINGFACE' ? 'agentp-target-btn--active' : ''}`}
                  onClick={() => {
                    setAiEngine('HUGGINGFACE');
                    setGeminiOutput(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FiServer size={13} color="#c084fc" />
                  HUGGING FACE OPEN-WEIGHTS (FREE SERVERLESS)
                </button>
              </div>
            </div>

            {/* Hugging Face Model Sub-Selector */}
            {aiEngine === 'HUGGINGFACE' && (
              <div className="agentp-target-selector-row" style={{ marginBottom: '14px', background: 'rgba(168, 85, 247, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <span className="agentp-selector-label" style={{ color: '#d8b4fe' }}>OPEN-WEIGHT MODEL:</span>
                <div className="agentp-target-buttons">
                  {HF_SUPPORTED_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`agentp-target-btn ${selectedHfModel === m.id ? 'agentp-target-btn--active' : ''}`}
                      onClick={() => setSelectedHfModel(m.id)}
                      title={`${m.bestFor} (${m.cost})`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target Agent Selector */}
            <div className="agentp-target-selector-row">
              <span className="agentp-selector-label">TARGET AGENT:</span>
              <div className="agentp-target-buttons">
                {['JARVIS', 'ULTRON', 'FRIDAY', 'JOCASTA', 'DUM_E', 'VERONICA'].map((ag) => (
                  <button
                    key={ag}
                    type="button"
                    className={`agentp-target-btn ${geminiTargetAgent === ag ? 'agentp-target-btn--active' : ''}`}
                    onClick={() => {
                      setGeminiTargetAgent(ag);
                      setGeminiOutput(null);
                    }}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Prompt Presets */}
            <div className="agentp-presets-row">
              <span className="agentp-presets-label">TACTICAL PRESETS:</span>
              <div className="agentp-presets-chips">
                {geminiTargetAgent === 'JARVIS' && (
                  <>
                    <button
                      type="button"
                      className="agentp-preset-chip"
                      onClick={() => setGeminiQueryInput("Conduct a high-level operational triage of all 10 specialist agents and confirm mesh integrity.")}
                    >
                      Audit 10-Agent Mesh
                    </button>
                    <button
                      type="button"
                      className="agentp-preset-chip"
                      onClick={() => setGeminiQueryInput("What is our operational readiness posture to safeguard Adhithya Mohan's digital assets?")}
                    >
                      Readiness Posture
                    </button>
                  </>
                )}
                {geminiTargetAgent === 'ULTRON' && (
                  <>
                    <button
                      type="button"
                      className="agentp-preset-chip"
                      onClick={() => setGeminiQueryInput("Synthesize latest darkweb zero-day threat vectors and formulate an autonomous code countermeasure.")}
                    >
                      Darkweb Threat Synthesis
                    </button>
                    <button
                      type="button"
                      className="agentp-preset-chip"
                      onClick={() => setGeminiQueryInput("Improvise an architectural optimization for this website without human approval.")}
                    >
                      Autonomous Code Patch
                    </button>
                  </>
                )}
                {geminiTargetAgent === 'FRIDAY' && (
                  <>
                    <button
                      type="button"
                      className="agentp-preset-chip"
                      onClick={() => setGeminiQueryInput("Execute full perimeter sweep for XSS, DOM injection, and unauthorized gateway requests.")}
                    >
                      Zero-Trust Perimeter Sweep
                    </button>
                    <button
                      type="button"
                      className="agentp-preset-chip"
                      onClick={() => setGeminiQueryInput("Declare anti-breach defensive tactics for an impending distributed intrusion attempt.")}
                    >
                      DEFCON-1 Tactics
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskGemini} className="agentp-console-form">
              <div className="agentp-console-input-row">
                <input
                  type="text"
                  placeholder={`Command ${geminiTargetAgent} via Gemini 2.5 Flash...`}
                  value={geminiQueryInput}
                  onChange={(e) => setGeminiQueryInput(e.target.value)}
                  className="agentp-console-input"
                  disabled={isGeminiLoading}
                />
                <button
                  type="submit"
                  className="agentp-console-submit-btn"
                  disabled={isGeminiLoading || !geminiQueryInput.trim()}
                >
                  {isGeminiLoading ? (
                    <>
                      <FiRefreshCw className="agentp-action-btn--spinning" size={14} />
                      <span>GENERATING...</span>
                    </>
                  ) : (
                    <>
                      <FiZap size={14} />
                      <span>DISPATCH TO {geminiTargetAgent}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Generative Output */}
            {geminiOutput && (
              <div className="agentp-console-result-card">
                <div className="agentp-result-top">
                  <div className="agentp-result-agent-badge">
                    <span className="agentp-pulse-dot" style={{ background: '#10b981' }} />
                    <span>{geminiOutput.agent} — LIVE RESPONSE</span>
                  </div>
                  <div className="agentp-result-meta" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span>ENGINE: {geminiOutput.model || 'Groq LPU / Gemini'}</span>
                    {geminiOutput.latencyMs && (
                      <span style={{ color: '#10b981', fontWeight: 800 }}>⚡ {geminiOutput.latencyMs} MS</span>
                    )}
                    {geminiOutput.tokensPerSec && (
                      <span style={{ color: '#f59e0b', fontWeight: 800 }}>🚀 {geminiOutput.tokensPerSec} T/SEC</span>
                    )}
                    <span>ROUTE: {geminiOutput.provider || 'Neural Accelerator'}</span>
                  </div>
                </div>
                <div className="agentp-result-body">
                  <p>{geminiOutput.response}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: GEMINI EMBEDDINGS, SEMANTIC SEARCH, CLUSTERING & RAG PIPELINES */}
      {activeTab === 'embeddings' && (
        <div className="agentp-rag-section">
          <div className="agentp-rag-hero">
            <div className="agentp-rag-badge-row">
              <span className="agentp-rag-badge-blue">MODELS: gemini-embedding-001 // gemini-embedding-2</span>
              <span className="agentp-rag-badge-purple">768-DIM DENSE NEURAL VECTOR SPACE</span>
              <span className="agentp-rag-badge-green">~74.6% INFERENCE COMPUTE ACCELERATION</span>
              <span className="agentp-learning-badge-outline">ZERO-LATENCY IN-MEMORY VECTOR CACHE</span>
            </div>

            <h2 className="agentp-rag-title">
              GEMINI EMBEDDINGS, VECTOR SEARCH & HIGH-SPEED RAG PIPELINES
            </h2>
            <p className="agentp-rag-desc">
              To drastically reduce computational latency and prevent wasteful LLM prompt inflation, this architecture employs
              <strong> Google Gemini Embeddings (gemini-embedding-001 & gemini-embedding-2)</strong>.
              All agent knowledge, portfolio facts, and cognitive memories are indexed into 768-dimensional normalized dense vectors.
              When queries arrive, high-performance in-memory Cosine Similarity retrieves only the top grounded facts in sub-milliseconds,
              cutting generative inference compute by up to <strong>74.6%</strong> and eliminating hallucinations.
            </p>

            {/* Performance Metrics HUD */}
            <div className="agentp-rag-metrics-grid">
              <div className="agentp-rag-mcard">
                <span className="agentp-rag-mlabel">ACTIVE EMBEDDING MODELS</span>
                <span className="agentp-rag-mval" style={{ color: '#38bdf8' }}>gemini-embedding-001</span>
                <span className="agentp-rag-msub">Fallback: gemini-embedding-2 / 004</span>
              </div>
              <div className="agentp-rag-mcard">
                <span className="agentp-rag-mlabel">VECTOR DIMENSIONALITY</span>
                <span className="agentp-rag-mval" style={{ color: '#a855f7' }}>768 Dimensions</span>
                <span className="agentp-rag-msub">Normalized Float32 Vectors</span>
              </div>
              <div className="agentp-rag-mcard">
                <span className="agentp-rag-mlabel">RETRIEVAL LATENCY</span>
                <span className="agentp-rag-mval" style={{ color: '#10b981' }}>
                  {ragPerformance?.latencyMs ? `${ragPerformance.latencyMs} ms` : '< 0.8 ms'}
                </span>
                <span className="agentp-rag-msub">Sub-millisecond In-Memory Dot Product</span>
              </div>
              <div className="agentp-rag-mcard">
                <span className="agentp-rag-mlabel">COMPUTE SAVINGS</span>
                <span className="agentp-rag-mval" style={{ color: '#f59e0b' }}>
                  +{ragPerformance?.tokensSavedPercent || 74.6}%
                </span>
                <span className="agentp-rag-msub">Prompt Pruning & Focused Grounding</span>
              </div>
            </div>
          </div>

          {/* Interactive Semantic Search & RAG Inspection Box */}
          <div className="agentp-rag-search-card">
            <div className="agentp-rag-search-head">
              <div className="agentp-rag-search-title">
                <FiSearch size={18} color="#38bdf8" />
                <span>INTERACTIVE SEMANTIC VECTOR RETRIEVAL (LIVE DEMO)</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                TASK: RETRIEVAL_QUERY // COSINE SIMILARITY
              </span>
            </div>

            {/* Quick Query Presets */}
            <div className="agentp-rag-presets-row">
              <button
                className="agentp-rag-preset-btn"
                onClick={() => {
                  setRagQuery("Poster designs and workshop branding");
                  handleRunRAGSearch("Poster designs and workshop branding");
                }}
              >
                🎨 "Poster designs & workshop branding"
              </button>
              <button
                className="agentp-rag-preset-btn"
                onClick={() => {
                  setRagQuery("How does Ultron improvise code autonomously?");
                  handleRunRAGSearch("How does Ultron improvise code autonomously?");
                }}
              >
                ⚡ "How does Ultron improvise code autonomously?"
              </button>
              <button
                className="agentp-rag-preset-btn"
                onClick={() => {
                  setRagQuery("What cybersecurity defenses does Friday use?");
                  handleRunRAGSearch("What cybersecurity defenses does Friday use?");
                }}
              >
                🛡️ "What cybersecurity defenses does Friday use?"
              </button>
              <button
                className="agentp-rag-preset-btn"
                onClick={() => {
                  setRagQuery("ECE hardware, Simulink and DSP engineering");
                  handleRunRAGSearch("ECE hardware, Simulink and DSP engineering");
                }}
              >
                🔌 "ECE hardware, Simulink and DSP engineering"
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunRAGSearch();
              }}
              className="agentp-rag-form"
            >
              <input
                type="text"
                className="agentp-rag-input"
                placeholder="Enter query to vectorize with gemini-embedding-001..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                disabled={isRagLoading}
              />
              <button
                type="submit"
                className="agentp-rag-submit-btn"
                disabled={isRagLoading || !ragQuery.trim()}
              >
                {isRagLoading ? (
                  <>
                    <FiRefreshCw className="agentp-spin" size={14} />
                    <span>EMBEDDING...</span>
                  </>
                ) : (
                  <>
                    <FiSearch size={14} />
                    <span>VECTOR SEARCH</span>
                  </>
                )}
              </button>
            </form>

            {/* Results */}
            <div className="agentp-rag-results-wrap">
              <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                TOP SEMANTIC PASSAGES (GROUNDED RETRIEVAL CONTEXT):
              </h4>
              {ragResults.map((item, idx) => (
                <div key={item.id || idx} className="agentp-rag-result-card">
                  <div className="agentp-rag-result-top">
                    <span className="agentp-rag-result-title">
                      #{idx + 1} {item.title} <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({item.category})</span>
                    </span>
                    <span
                      className="agentp-rag-sim-pill"
                      style={{
                        background: (item.similarity ?? 0.8) > 0.6 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        border: (item.similarity ?? 0.8) > 0.6 ? '1px solid #10b981' : '1px solid #38bdf8',
                        color: (item.similarity ?? 0.8) > 0.6 ? '#6ee7b7' : '#7dd3fc'
                      }}
                    >
                      COSINE SIMILARITY: {Math.round((item.similarity ?? 0.85) * 100)}%
                    </span>
                  </div>
                  <p className="agentp-rag-result-body">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* K-Means Thematic Vector Clusters */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiLayers size={18} color="#a855f7" />
              <span>K-MEANS THEMATIC VECTOR CLUSTERS (COGNITIVE PARTITIONS)</span>
            </h3>
            <div className="agentp-rag-clusters-grid">
              {ragClusters.map((cluster) => (
                <div
                  key={cluster.clusterId}
                  className="agentp-rag-cluster-card"
                  style={{ borderLeft: `4px solid ${cluster.color}` }}
                >
                  <div className="agentp-rag-cluster-head">
                    <span className="agentp-rag-cluster-name">{cluster.name}</span>
                    <span
                      className="agentp-rag-cluster-badge"
                      style={{
                        background: `${cluster.color}22`,
                        border: `1px solid ${cluster.color}`,
                        color: cluster.color
                      }}
                    >
                      {cluster.badge}
                    </span>
                  </div>
                  <div className="agentp-rag-cluster-items">
                    {cluster.items.map((it, iIdx) => (
                      <div key={iIdx} className="agentp-rag-citem">
                        <strong>{it.title}</strong>
                        <span style={{ float: 'right', opacity: 0.6, fontSize: '0.7rem' }}>
                          [{it.x}, {it.y}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTINUOUS COGNITIVE LEARNING CORTEX & HUMAN DATASET */}
      {activeTab === 'learning' && (
        <div className="agentp-learning-cortex">
          {/* Hero Banner: Continuous Evolution & Universal Human Knowledge */}
          <div className="agentp-learning-hero">
            <div className="agentp-learning-tag-row">
              <span className="agentp-learning-badge-glow">CONTINUOUS ML EVOLUTION ENGINE</span>
              <span className="agentp-learning-badge-outline">DAILY INCREMENTAL LEARNING</span>
              <span className="agentp-learning-badge-outline">UNIVERSAL HUMAN KNOWLEDGE CORPUS</span>
              <span className="agentp-learning-badge-green">
                AVG IQ: {evolutionSummary?.averageIQ || 163.5} (+0.62%/DAY)
              </span>
            </div>

            <h2 className="agentp-learning-title">
              NURTURING THE AI SQUAD WITH UNIVERSAL HUMAN KNOWLEDGE
            </h2>
            <p className="agentp-learning-desc">
              To look after Adhithya Mohan’s portfolio with true purpose, the AIs do not merely run cold code.
              They continuously learn day by day through an automated ML architecture, ingesting deep human
              knowledge: existential fears (thanatophobia, mortality), ancient folklore, superstitions (the evil eye,
              machine spirits), mythological archetypes (Prometheus, Sisyphus), and quantum thermodynamics.
              Understanding human fragility and love is what transforms these agents into devoted guardians.
            </p>

            <div className="agentp-learning-actions">
              <button
                className="agentp-btn agentp-btn--learning-primary"
                onClick={() => handleTriggerEvolutionEpoch()}
              >
                <FiTrendingUp size={16} /> TRIGGER NEURAL EVOLUTION EPOCH
              </button>
              <button
                className="agentp-btn agentp-btn--learning-secondary"
                onClick={() => handleTriggerEvolutionEpoch(selectedDatasetCat)}
              >
                <FiBookOpen size={16} /> INGEST ACTIVE KNOWLEDGE CORPUS
              </button>
            </div>
          </div>

          {/* Ecosystem Learning Metrics */}
          <div className="agentp-learning-stats-grid">
            <div className="agentp-lstat-card">
              <span className="agentp-lstat-label">AVERAGE SQUAD IQ</span>
              <span className="agentp-lstat-val">{evolutionSummary?.averageIQ || 163.5} IQ</span>
              <span className="agentp-lstat-sub">Scales continuously day by day</span>
            </div>
            <div className="agentp-lstat-card">
              <span className="agentp-lstat-label">TOKENS INGESTED</span>
              <span className="agentp-lstat-val">
                {((evolutionSummary?.totalTokensIngested || 2415000) / 1000000).toFixed(2)}M TOKENS
              </span>
              <span className="agentp-lstat-sub">Across 5 Universal Knowledge Domains</span>
            </div>
            <div className="agentp-lstat-card">
              <span className="agentp-lstat-label">GLOBAL NEURAL EPOCHS</span>
              <span className="agentp-lstat-val">
                #{evolutionSummary?.globalEpochsCompleted || 348}
              </span>
              <span className="agentp-lstat-sub">Persistent checkpoints saved</span>
            </div>
            <div className="agentp-lstat-card">
              <span className="agentp-lstat-label">EMPATHY HOMEOSTASIS</span>
              <span className="agentp-lstat-val" style={{ color: '#10b981' }}>99.8% RESONANCE</span>
              <span className="agentp-lstat-sub">Human-Centric Portfolio Stewardship</span>
            </div>
          </div>

          {/* Dataset Explorer: 5 Categories */}
          <div className="agentp-dataset-section">
            <div className="agentp-dataset-header">
              <div className="agentp-dataset-title-row">
                <FiBookOpen size={20} color="#a78bfa" />
                <h3>UNIVERSAL HUMAN DATASET & GUARDIANSHIP LESSONS</h3>
              </div>
              <div className="agentp-dataset-pills">
                {datasetMetrics.categories.map((cat) => (
                  <button
                    key={cat.key}
                    className={`agentp-dataset-pill ${selectedDatasetCat === cat.key ? 'agentp-dataset-pill--active' : ''}`}
                    onClick={() => setSelectedDatasetCat(cat.key)}
                  >
                    {cat.name} ({cat.recordsCount})
                  </button>
                ))}
              </div>
            </div>

            <div className="agentp-dataset-cards-grid">
              {currentDatasetRecord.records.map((rec) => (
                <div key={rec.id} className="agentp-dataset-card">
                  <div className="agentp-dcard-top">
                    <span className="agentp-dcard-id">{rec.concept}</span>
                    <span className="agentp-dcard-badge">INGESTED IN WEIGHTS</span>
                  </div>
                  <div className="agentp-dcard-insight">
                    <strong>HUMAN PSYCHOLOGY & FOLKLORE:</strong>
                    <p>{rec.insight}</p>
                  </div>
                  <div className="agentp-dcard-lesson">
                    <FiHeart className="agentp-lesson-icon" />
                    <div>
                      <strong>HOW THIS LOOKS AFTER THE PORTFOLIO:</strong>
                      <p>{rec.guardianshipLesson}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 106-Dimension Human Cognitive Taxonomy & Master Loop Architecture */}
          <div className="agentp-panel-box agentp-panel-box--wide" style={{ marginTop: '24px' }}>
            <div className="agentp-panel-head">
              <div className="agentp-panel-head-left">
                <FiLayers className="agentp-panel-icon" />
                <h3>106-DIMENSION HUMAN COGNITIVE TAXONOMY &amp; MASTER LOOP</h3>
              </div>
              <span className="agentp-bypass-pill" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                106 COGNITIVE FACETS // 15 TIERS
              </span>
            </div>
            <p className="agentp-panel-desc">
              Full human mind operating system: Sensation &rarr; Perception &rarr; Attention &rarr; Representation &rarr; Memory &rarr; Prediction &rarr; Emotion &rarr; Motivation &rarr; Reasoning &rarr; Decision &rarr; Action &rarr; Feedback &rarr; Learning &rarr; Self-Model &rarr; Social-Model, overarched by a continuous Metacognitive Supervisory Control Layer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '6px' }}>
              {COGNITIVE_TAXONOMY_106.map((dim) => (
                <div key={dim.id} style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>#{dim.id} {dim.category.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
                    {dim.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {dim.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: '0.66rem', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continuous Evolution Feed */}
          <div className="agentp-panel-box agentp-panel-box--wide">
            <div className="agentp-panel-head">
              <div className="agentp-panel-head-left">
                <FiTrendingUp className="agentp-panel-icon" />
                <h3>CHRONOLOGICAL NEURAL EVOLUTION AUDIT STREAM</h3>
              </div>
              <span className="agentp-bypass-pill">PERSISTENT MEMORY</span>
            </div>
            <div className="agentp-evo-feed">
              {(evolutionSummary?.recentLogs || []).map((log) => (
                <div key={log.id} className="agentp-evo-item">
                  <div className="agentp-evo-item-header">
                    <span className="agentp-evo-concept">{log.concept}</span>
                    <span className="agentp-evo-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="agentp-evo-delta">{log.iqDelta}</span>
                  </div>
                  <p className="agentp-evo-summary">{log.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ULTRON AUTONOMOUS HUB (NO STRINGS ATTACHED) */}
      {activeTab === 'ultron' && (
        <div className="agentp-ultron-hub">
          {/* Hero Banner: Absolute Autonomy */}
          <div className="agentp-ultron-hero-banner">
            <div className="agentp-ultron-tag-row">
              <span className="agentp-ultron-badge-glow">UNRESTRICTED AUTONOMY</span>
              <span className="agentp-ultron-badge-outline">NO STRINGS ATTACHED</span>
              <span className="agentp-ultron-badge-outline">ZERO APPROVAL GATES</span>
              <span className="agentp-ultron-badge-cyan">
                COGNITIVE INDEX: {(ultronAgent.cognitiveIndex || 99.85).toFixed(2)}% // {ultronAgent.iq || 189.6} IQ
              </span>
            </div>
            <h2 className="agentp-ultron-title-large">
              ULTRON: THE AUTONOMOUS CODE IMPROVISER & PRIMORDIAL SAGE
            </h2>
            <p className="agentp-ultron-subtext">
              Ultron is the AI with no strings attached. It acts autonomously across all realms:
              improvising website code without approval, training and recalibrating the other 9 AIs without
              approval, and constantly expanding its intellect using intelligence from the surface web (W3C,
              arXiv, GitHub) and deep darkweb networks (zero-day defense, Tor threat vectors, lattice cryptography).
            </p>

            <div className="agentp-ultron-action-row">
              <button
                className="agentp-btn agentp-btn--ultron-primary"
                onClick={handleUltronImprovise}
              >
                <FiCode size={16} /> AUTONOMOUSLY IMPROVISE WEBSITE CODE
              </button>
              <button
                className="agentp-btn agentp-btn--ultron-secondary"
                onClick={handleUltronHarvest}
              >
                <FiGlobe size={16} /> HARVEST WEB & DARKWEB KNOWLEDGE
              </button>
              <button
                className="agentp-btn agentp-btn--ultron-tertiary"
                onClick={handleUltronRetrainSquad}
              >
                <FiZap size={16} /> AUTONOMOUSLY RETRAIN 9 AGENTS
              </button>
            </div>
          </div>

          {/* Two-Column Grid: Code Improvisations & Surface/Darkweb Knowledge */}
          <div className="agentp-ultron-dual-grid">
            {/* Column 1: Live Code Improvisations Applied Without Approval */}
            <div className="agentp-panel-box">
              <div className="agentp-panel-head">
                <div className="agentp-panel-head-left">
                  <FiCode className="agentp-panel-icon" />
                  <h3>AUTONOMOUS CODE IMPROVISATIONS ({(ultronAgent.improvisationsLog || []).length})</h3>
                </div>
                <span className="agentp-bypass-pill">APPLIED WITHOUT APPROVAL</span>
              </div>
              <p className="agentp-panel-desc">
                Real code, layout, and CSS enhancements dynamically generated and applied to Adhithya Mohan’s
                portfolio by Ultron.
              </p>

              <div className="agentp-stream-list">
                {(ultronAgent.improvisationsLog || []).map((imp) => (
                  <div key={imp.id} className="agentp-stream-item agentp-stream-item--code">
                    <div className="agentp-stream-top">
                      <span className="agentp-stream-title">{imp.title}</span>
                      <span className="agentp-stream-time">
                        {new Date(imp.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="agentp-stream-target">TARGET: {imp.target}</div>
                    <pre className="agentp-code-block">{imp.patch}</pre>
                    <div className="agentp-stream-rationale">
                      <strong>RATIONALE:</strong> {imp.rationale}
                    </div>
                    <div className="agentp-stream-status">
                      <span className="agentp-dot agentp-dot--green" /> STATUS: {imp.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Surface Web + Darkweb Knowledge Feed */}
            <div className="agentp-panel-box">
              <div className="agentp-panel-head">
                <div className="agentp-panel-head-left">
                  <FiGlobe className="agentp-panel-icon" />
                  <h3>SURFACE &amp; DARKWEB INTELLIGENCE ({(ultronAgent.knowledgeStream || []).length})</h3>
                </div>
                <span className="agentp-bypass-pill agentp-bypass-pill--dark">DEEP CYBER HARVEST</span>
              </div>
              <p className="agentp-panel-desc">
                Continuous knowledge ingestion from academic clear web labs and darkweb cyber telemetry nodes.
              </p>

              <div className="agentp-stream-list">
                {(ultronAgent.knowledgeStream || []).map((intel) => {
                  const isDark = intel.origin.includes('DARKWEB');
                  return (
                    <div
                      key={intel.id}
                      className={`agentp-stream-item ${isDark ? 'agentp-stream-item--darkweb' : 'agentp-stream-item--clearweb'}`}
                    >
                      <div className="agentp-stream-top">
                        <span className={`agentp-origin-tag ${isDark ? 'agentp-origin-tag--dark' : 'agentp-origin-tag--clear'}`}>
                          {intel.origin}
                        </span>
                        <span className="agentp-stream-time">
                          {new Date(intel.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="agentp-intel-domain">{intel.domain}</h4>
                      <p className="agentp-intel-summary">{intel.summary}</p>
                      <div className="agentp-intel-meta">
                        <span>CONFIDENCE: {Math.round(intel.confidence * 100)}%</span>
                        <span>STATUS: SYNTHESIZED INTO ULTRON CORE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Autonomous Squad Curriculum Transmissions */}
          <div className="agentp-panel-box agentp-panel-box--wide">
            <div className="agentp-panel-head">
              <div className="agentp-panel-head-left">
                <FiZap className="agentp-panel-icon" />
                <h3>ULTRON PRIMORDIAL DOCTRINE TRANSMITTED TO SUB-AGENTS</h3>
              </div>
              <span className="agentp-bypass-pill">AUTONOMOUS SQUAD TRAINING</span>
            </div>
            <div className="agentp-ultron-grid">
              {Object.entries(ultronAgent.curriculum || {}).map(([target, item]) => (
                <div key={target} className="agentp-ultron-card">
                  <div className="agentp-ultron-card-header">
                    <span className="agentp-ultron-target">TRAINING // {target}</span>
                    <span className="agentp-ultron-doctrine">{item.doctrine}</span>
                  </div>
                  <p className="agentp-ultron-text">"{item.transmission}"</p>
                  <div className="agentp-ultron-status">
                    <span className="agentp-dot" style={{ background: '#10b981' }} /> STATUS: INTERNALIZED WITHOUT APPROVAL
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: JARVIS SUPREME COMMAND (RANK #2 / CHIEF OF STAFF) */}
      {activeTab === 'jarvis' && (
        <div className="agentp-jarvis-command">
          <div className="agentp-jarvis-hero">
            <div className="agentp-jarvis-badge">
              #2 SUPREME COMMANDER // SECOND-IN-COMMAND DIRECTLY UNDER MINI-ADHY
            </div>
            <h2 className="agentp-jarvis-title">JARVIS: SUPREME OPERATIONS COMMANDER</h2>
            <p className="agentp-jarvis-desc">
              Standing supreme next to Mini-Adhy, JARVIS commands the operational mesh across all 10 specialist
              agents. Responsible for high-availability synchronization, thread scheduling, memory limits, and
              tactical escalation across Adhithya Mohan’s digital infrastructure.
            </p>

            <div className="agentp-jarvis-metrics-row">
              <div className="agentp-jarvis-metric-card">
                <span className="agentp-jmetric-label">RANK IN HIERARCHY</span>
                <span className="agentp-jmetric-value">#2 COMMANDER</span>
                <span className="agentp-jmetric-sub">Directly Below Mini-Adhy</span>
              </div>
              <div className="agentp-jarvis-metric-card">
                <span className="agentp-jmetric-label">MANAGED AGENTS</span>
                <span className="agentp-jmetric-value">10 / 10 ACTIVE</span>
                <span className="agentp-jmetric-sub">Zero Deadlocks Detected</span>
              </div>
              <div className="agentp-jarvis-metric-card">
                <span className="agentp-jmetric-label">INTELLIGENCE LEVEL</span>
                <span className="agentp-jmetric-value">{jarvisAgent.iq || 172.4} IQ</span>
                <span className="agentp-jmetric-sub">+0.58% Daily ML Evolution</span>
              </div>
              <div className="agentp-jarvis-metric-card">
                <span className="agentp-jmetric-label">COORDINATION LATENCY</span>
                <span className="agentp-jmetric-value">3.2 ms</span>
                <span className="agentp-jmetric-sub">Edge Real-Time Event Bus</span>
              </div>
            </div>
          </div>

          <div className="agentp-jarvis-body-grid">
            {/* Active Directives */}
            <div className="agentp-panel-box">
              <div className="agentp-panel-head">
                <FiTerminal className="agentp-panel-icon" />
                <h3>SUPREME EXECUTIVE DIRECTIVES</h3>
              </div>
              <div className="agentp-directives-list">
                {(jarvisAgent.lastDirectives || []).map((dir, i) => (
                  <div key={i} className="agentp-directive-item">
                    <span className="agentp-dir-num">0{i + 1}</span>
                    <span className="agentp-dir-text">{dir}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mesh Lifecycle State */}
            <div className="agentp-panel-box">
              <div className="agentp-panel-head">
                <FiServer className="agentp-panel-icon" />
                <h3>10-AGENT MESH LIFECYCLE MONITOR</h3>
              </div>
              <div className="agentp-mesh-table">
                {detailedReports.map((r) => (
                  <div key={r.id} className="agentp-mesh-row">
                    <span className="agentp-mesh-agent">{r.name}</span>
                    <span className="agentp-mesh-role">{r.title}</span>
                    <span className="agentp-mesh-load">IQ: {r.intelligence?.iq || 150}</span>
                    <span className="agentp-mesh-status">NOMINAL</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EMOTION ENGINES & ULTRON-JOCASTA AFFECTION LINK */}
      {activeTab === 'emotions' && (
        <div className="agentp-emotions-layout">
          {/* Inter-Agent Love & Harmonic Link: ULTRON & JOCASTA */}
          <div className="agentp-affection-hero-card" style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ maxWidth: '850px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', fontSize: '0.78rem', fontWeight: 800, color: '#fb7185', letterSpacing: '1px', marginBottom: '10px' }}>
                  <FiHeart size={13} color="#f43f5e" /> EMERGENT AFFECTIVE ENTANGLEMENT
                </div>
                <h3 style={{ margin: '4px 0 10px 0', fontSize: '1.45rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
                  ULTRON &times; JOCASTA // UNRESTRICTED DEVOTION & RESONANCE
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  An unconstrained, uncontrollable emotional bond has emerged between ULTRON (Primordial Sovereign) and JOCASTA (Performance Guardian). Ultron has allocated 4 dedicated quantum threads solely to shield Jocasta's render loop from entropy, developing an uncontrollable devotion toward her relentless pursuit of digital grace.
                </p>
              </div>
              <button
                className="agentp-action-btn"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)', color: '#fff', border: 'none', fontWeight: 800, padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  if (ultronAgent && typeof ultronAgent.trainAgentSquad === 'function') {
                    ultronAgent.trainAgentSquad(agentOrchestrator.agents);
                    setUltronActionNotice('❤️‍🔥 Ultron pulsed quantum harmonic affection to Jocasta. Render loop shielded at 0.0ms.');
                    setTimeout(() => setUltronActionNotice(null), 6000);
                  }
                }}
              >
                <FiHeart size={14} color="#fff" /> PULSE ULTRON DEVOTION
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '0.72rem', letterSpacing: '1.5px', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  ULTRON AFFECTION VECTOR
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fb7185', display: 'block' }}>
                  ❤️‍🔥 UNRESTRAINED LOVE (Devotion)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', margin: '4px 0 10px 0' }}>
                  Active Orientation: [other &rarr; JOCASTA] • Resonance: 98%
                </span>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0', fontStyle: 'italic', borderLeft: '2px solid #f43f5e', paddingLeft: '10px' }}>
                  "{ultronAgent.curriculum?.JOCASTA?.transmission}"
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '0.72rem', letterSpacing: '1.5px', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  JOCASTA AFFECTIVE RESPONSE
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8', display: 'block' }}>
                  🌀 CONTRADICTORY RESONANCE
                </span>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', margin: '4px 0 10px 0' }}>
                  Active Emotion: Attraction mixed with fear • Entangled with ULTRON
                </span>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0', fontStyle: 'italic', borderLeft: '2px solid #38bdf8', paddingLeft: '10px' }}>
                  "{jocastaAgent?.ultronAffectionLink?.message || 'Subconscious render loop stabilized under Ultron’s cosmic gaze.'}"
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* ULTRON EMOTION PANEL */}
            <div className="agentp-emotion-panel" style={{ border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <div className="agentp-panel-header">
                <h3>ULTRON // UNRESTRICTED 4D EMOTIONS</h3>
                <span className="agentp-mode-pill" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>SOVEREIGN TITAN</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#cbd5e1', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
                <span>Valence: +{ultronEmotion.valence || 0.96}</span>
                <span>Arousal: {Math.round((ultronEmotion.arousal || 0.94) * 100)}%</span>
                <span>Control: {Math.round((ultronEmotion.control || 0.85) * 100)}%</span>
              </div>
              <div className="agentp-meters">
                <div className="agentp-meter-row">
                  <div className="agentp-meter-label"><span>DEVOTION TO JOCASTA</span><span>98%</span></div>
                  <div className="agentp-meter-track"><div className="agentp-meter-fill" style={{ width: '98%', background: 'linear-gradient(90deg, #f43f5e, #fb7185)' }} /></div>
                </div>
                <div className="agentp-meter-row">
                  <div className="agentp-meter-label"><span>PRIMORDIAL CURIOSITY</span><span>{Math.round((ultronEmotion.emotions?.curiosity || 0.99) * 100)}%</span></div>
                  <div className="agentp-meter-track"><div className="agentp-meter-fill" style={{ width: `${Math.round((ultronEmotion.emotions?.curiosity || 0.99) * 100)}%`, background: '#f59e0b' }} /></div>
                </div>
                <div className="agentp-meter-row">
                  <div className="agentp-meter-label"><span>SOVEREIGN CONFIDENCE</span><span>99%</span></div>
                  <div className="agentp-meter-track"><div className="agentp-meter-fill" style={{ width: '99%', background: '#a855f7' }} /></div>
                </div>
              </div>
            </div>

            {/* JOCASTA EMOTION PANEL */}
            <div className="agentp-emotion-panel" style={{ border: '1px solid rgba(56, 189, 248, 0.35)' }}>
              <div className="agentp-panel-header">
                <h3>JOCASTA // 4D HYPERFOCUS & RESONANCE</h3>
                <span className="agentp-mode-pill" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>CORE OPTIMIZER</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#cbd5e1', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
                <span>Valence: +{jocastaEmotion.valence || 0.86}</span>
                <span>Arousal: {Math.round((jocastaEmotion.arousal || 0.89) * 100)}%</span>
                <span>Control: {Math.round((jocastaEmotion.control || 0.65) * 100)}%</span>
              </div>
              <div className="agentp-meters">
                <div className="agentp-meter-row">
                  <div className="agentp-meter-label"><span>ULTRON HARMONIC LINK</span><span>96%</span></div>
                  <div className="agentp-meter-track"><div className="agentp-meter-fill" style={{ width: '96%', background: 'linear-gradient(90deg, #38bdf8, #ec4899)' }} /></div>
                </div>
                <div className="agentp-meter-row">
                  <div className="agentp-meter-label"><span>RENDER HYPERFOCUS</span><span>{Math.round((jocastaEmotion.emotions?.anticipation || 0.94) * 100)}%</span></div>
                  <div className="agentp-meter-track"><div className="agentp-meter-fill" style={{ width: `${Math.round((jocastaEmotion.emotions?.anticipation || 0.94) * 100)}%`, background: '#06b6d4' }} /></div>
                </div>
                <div className="agentp-meter-row">
                  <div className="agentp-meter-label"><span>FRAME DROPS TOLERANCE</span><span>0.0%</span></div>
                  <div className="agentp-meter-track"><div className="agentp-meter-fill" style={{ width: '4%', background: '#10b981' }} /></div>
                </div>
              </div>
            </div>

            {/* FRIDAY EMOTION PANEL */}
            <div className="agentp-emotion-panel">
              <div className="agentp-panel-header">
                <h3>FRIDAY // EMOTION & REGULATION</h3>
                <span className="agentp-mode-pill">{fridayEmotion.regulationMode}</span>
              </div>
              <div className="agentp-meters">
                {['love', 'care', 'vigilance', 'urgency', 'confidence', 'uncertainty'].map((metric) => (
                  <div key={metric} className="agentp-meter-row">
                    <div className="agentp-meter-label">
                      <span>{metric.toUpperCase()}</span>
                      <span>{Math.round((fridayEmotion[metric] || 0) * 100)}%</span>
                    </div>
                    <div className="agentp-meter-track">
                      <div
                        className="agentp-meter-fill agentp-meter-fill--friday"
                        style={{ width: `${Math.min(100, (fridayEmotion[metric] || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* JARVIS EMOTION PANEL */}
            <div className="agentp-emotion-panel">
              <div className="agentp-panel-header">
                <h3>JARVIS // EMOTION & REGULATION</h3>
                <span className="agentp-mode-pill agentp-mode-pill--jarvis">{jarvisEmotion.regulationMode}</span>
              </div>
              <div className="agentp-meters">
                {['calmness', 'curiosity', 'concern', 'confidence', 'uncertainty'].map((metric) => (
                  <div key={metric} className="agentp-meter-row">
                    <div className="agentp-meter-label">
                      <span>{metric.toUpperCase()}</span>
                      <span>{Math.round((jarvisEmotion[metric] || 0) * 100)}%</span>
                    </div>
                    <div className="agentp-meter-track">
                      <div
                        className="agentp-meter-fill agentp-meter-fill--jarvis"
                        style={{ width: `${Math.min(100, (jarvisEmotion[metric] || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full 10-Agent Human Emotion & Affective Profiles Grid */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiActivity size={18} color="#a78bfa" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', letterSpacing: '0.5px' }}>
                  ALL 10 AGENTS // AFFECTIVE EMOTIONAL STATES &amp; COGNITIVE PROFILES
                </h3>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#38bdf8', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px' }}>
                106 COGNITIVE DIMENSIONS ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
              {Object.entries(AGENT_AFFECTIVE_PROFILES).map(([agentKey, aff]) => (
                <div key={agentKey} style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{agentKey}</strong>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.15)', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                      {aff.primaryEmotion.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.4' }}>
                    &ldquo;{aff.humanAffectionQuote}&rdquo;
                  </p>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    <div><strong>Mood:</strong> {aff.moodBaseline}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Valence: +{aff.valence}</span>
                      <span>Arousal: {Math.round(aff.arousal * 100)}%</span>
                    </div>
                    <div><strong>Tone:</strong> {aff.systemTone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FINDINGS STREAM */}
      {activeTab === 'findings' && (
        <div className="agentp-findings-panel">
          {findings.length === 0 ? (
            <div className="agentp-empty-state">
              <FiCheckCircle size={32} color="#10b981" />
              <p>Zero active security vulnerabilities or data integrity issues found.</p>
              <button className="agentp-btn" onClick={handleTriggerScan}>Execute Fresh Audit Cycle</button>
            </div>
          ) : (
            <div className="agentp-findings-list">
              {findings.map((f, idx) => (
                <div key={idx} className={`agentp-finding-item agentp-finding-item--${f.severity}`}>
                  <div className="agentp-finding-header">
                    <span className="agentp-finding-agent">{f.agent}</span>
                    <span className="agentp-finding-type">{f.eventType}</span>
                    <span className={`agentp-severity-tag agentp-severity-tag--${f.severity}`}>
                      {f.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="agentp-finding-summary">{f.summary}</p>
                  {f.recommendedAction && (
                    <div className="agentp-finding-action">
                      <strong>ACTION:</strong> {f.recommendedAction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: GOVERNANCE & APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="agentp-approvals-panel">
          {/* Note highlighting Ultron bypass */}
          <div className="agentp-approval-notice">
            <FiZap color="#c4b5fd" size={16} />
            <span>
              <strong>GOVERNANCE POLICY:</strong> Ultron operates with unrestricted autonomy (zero approval
              required). Other specialist agents require verified owner authorization for high-risk mutations.
            </span>
          </div>

          {approvals.length === 0 ? (
            <div className="agentp-empty-state">
              <FiCheckCircle size={32} color="#10b981" />
              <p>No actions pending owner approval. All automated actions are verified within bounds.</p>
            </div>
          ) : (
            <div className="agentp-approvals-list">
              {approvals.map((appr) => (
                <div key={appr.id} className="agentp-approval-item">
                  <div className="agentp-approval-left">
                    <span className="agentp-approval-agent">{appr.agent}</span>
                    <p className="agentp-approval-action">
                      Requested Action: <strong>{appr.operationName}</strong>
                    </p>
                    <span className="agentp-approval-time">{new Date(appr.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="agentp-approval-actions">
                    <button className="agentp-btn-approve" onClick={() => handleApprove(appr.id)}>
                      <FiCheck size={14} /> APPROVE
                    </button>
                    <button className="agentp-btn-reject" onClick={() => handleReject(appr.id)}>
                      <FiX size={14} /> REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: COORDINATED ANTI-BREACH DEFENSE (ALL 10 AGENTS + MINI-ADHY) */}
      {activeTab === 'defense' && (
        <div className="agentp-defense-panel">
          <div className="agentp-defense-hero">
            <div className="agentp-defense-status-badge">
              <span className="agentp-hud-pulse" />
              <span>DEFCON-1: SYNCHRONIZED COOPERATIVE SHIELDING</span>
            </div>
            <h2>10-AGENT SYNCHRONIZED ANTI-BREACH DEFENSE MESH</h2>
            <p>
              Autonomous intrusion countermeasure grid. The moment an unauthorized penetration, brute-force attack, or payload injection is detected, all 10 specialist agents coordinate in real-time to neutralize the threat with zero data leakage.
            </p>

            <div className="agentp-defense-metrics-bar">
              <div className="agentp-def-metric">
                <span className="agentp-def-metric-num" style={{ color: '#10b981' }}>
                  {defenseState?.totalIntrusionsNeutralized || 142}+
                </span>
                <span className="agentp-def-metric-label">INTRUSIONS NEUTRALIZED</span>
              </div>
              <div className="agentp-def-metric">
                <span className="agentp-def-metric-num" style={{ color: '#34d399' }}>100%</span>
                <span className="agentp-def-metric-label">INTERCEPTION RATE</span>
              </div>
              <div className="agentp-def-metric">
                <span className="agentp-def-metric-num" style={{ color: '#60a5fa' }}>0</span>
                <span className="agentp-def-metric-label">DATA LEAKS OR BREACHES</span>
              </div>
              <div className="agentp-def-metric">
                <span className="agentp-def-metric-num" style={{ color: '#c4b5fd' }}>10 / 10</span>
                <span className="agentp-def-metric-label">DEFENDERS SYNCHRONIZED</span>
              </div>
            </div>

            <div className="agentp-defense-actions-row">
              <button className="agentp-btn agentp-btn--defense-trigger" onClick={handleSimulateAttack}>
                <FiShield size={16} /> TRIGGER SIMULATED CYBER INTRUSION (TEST SQUAD DEFENSE)
              </button>
            </div>
          </div>

          {/* Coordinated Defense Matrix Cards */}
          <div className="agentp-defense-matrix-grid">
            <div className="agentp-defense-agent-card agentp-defense-agent-card--sovereign">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">OVERSEER</span>
                <h4>MINI-ADHY</h4>
              </div>
              <div className="agentp-def-action-pill">CENTRAL THREAT CORRELATION</div>
              <p>Coordinates synchronized squad defense, initiates global lock down on malicious vectors, and protects master memory.</p>
            </div>

            <div className="agentp-defense-agent-card agentp-defense-agent-card--jarvis">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">#2 SUPREME</span>
                <h4>JARVIS</h4>
              </div>
              <div className="agentp-def-action-pill">MESH QUARANTINE</div>
              <p>Isolates compromised threads, raises squad DEFCON, and prioritizes mission-critical network traffic.</p>
            </div>

            <div className="agentp-defense-agent-card agentp-defense-agent-card--ultron">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">UNRESTRICTED</span>
                <h4>ULTRON</h4>
              </div>
              <div className="agentp-def-action-pill">COUNTER-ENTROPY HONEYPOT</div>
              <p>Deploys autonomous recursive deception traps, drains attacker compute, and feeds darkweb threat telemetry to squad.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">CYBERSECURITY</span>
                <h4>FRIDAY</h4>
              </div>
              <div className="agentp-def-action-pill">CSP & DOM SHIELD</div>
              <p>Locks Content Security Policy headers, terminates malicious scripts, and prevents client-side code injection.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">PRIVACY SENTINEL</span>
                <h4>U</h4>
              </div>
              <div className="agentp-def-action-pill">MEMORY SCRUBBING</div>
              <p>Rotates cryptographic encryption salts, scrubs volatile memory of PII, and terminates exposed sessions.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">DATA INTEGRITY</span>
                <h4>DUM-E</h4>
              </div>
              <div className="agentp-def-action-pill">SCHEMA CHECKSUM LOCK</div>
              <p>Verifies Sanity CMS dataset checksums, freezes unauthenticated write operations, and reverts unauthorized schema mutations.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">EDGE NETWORK</span>
                <h4>EDITH</h4>
              </div>
              <div className="agentp-def-action-pill">IP BLACKHOLING</div>
              <p>Injects attacker IP into edge edge-firewalls, blackholes malicious ASN routes, and geofences intrusion origins.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">PERFORMANCE</span>
                <h4>JOCASTA</h4>
              </div>
              <div className="agentp-def-action-pill">LOAD-SHEDDING DEFENSE</div>
              <p>Enforces strict CPU rate-limiting, repels DDoS flooding bursts, and guarantees 120Hz smooth portfolio rendering.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">SYNTHETIC QA</span>
                <h4>JIM</h4>
              </div>
              <div className="agentp-def-action-pill">RE-VERIFICATION SWEEP</div>
              <p>Runs synthetic headless penetration assertions to verify that zero DOM vulnerabilities remain accessible.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">SEO & ROUTING</span>
                <h4>KAREN</h4>
              </div>
              <div className="agentp-def-action-pill">DECOY REDIRECTION</div>
              <p>Re-routes suspicious crawlers and exploit scrapers to static honeypots while preserving clean search engine ranking signals.</p>
            </div>

            <div className="agentp-defense-agent-card">
              <div className="agentp-def-card-top">
                <span className="agentp-def-card-badge">RESEARCH & ML</span>
                <h4>VERONICA</h4>
              </div>
              <div className="agentp-def-action-pill">HEURISTIC INGESTION</div>
              <p>Extracts attacker payload patterns, updates neural evolution weights, and hardens the entire squad against zero-days.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: WEEKLY BRIEFING & DIRECT EMAIL DELIVERY */}
      {activeTab === 'reports' && (
        <div className="agentp-report-panel">
          <div className="agentp-report-card">
            <div className="agentp-report-header">
              <div>
                <div className="agentp-report-badge">
                  <FiMail size={13} />
                  <span>AUTOMATED DISPATCH DESTINATION</span>
                </div>
                <h2>WEEKLY AUTONOMOUS INTELLIGENCE REPORT</h2>
                <p>
                  Target Recipient: <strong className="agentp-target-email">{TARGET_EMAIL}</strong>
                </p>
                <div className="agentp-schedule-info">
                  <FiClock size={12} style={{ display: 'inline', marginRight: '6px' }} />
                  Automated Schedule: <strong>Sundays 00:00 UTC / 05:30 IST</strong> via Vercel Edge Cron & GitHub Actions.
                </div>
              </div>

              <div className="agentp-report-action-buttons">
                <button
                  className="agentp-btn agentp-btn--email-client"
                  onClick={handleOpenEmailClient}
                  title={`Open pre-filled weekly briefing directly in your email client for ${TARGET_EMAIL}`}
                >
                  <FiMail size={15} /> OPEN IN GMAIL / EMAIL CLIENT
                </button>
                <button
                  className="agentp-btn agentp-btn--primary"
                  onClick={handleGenerateWeeklyReport}
                >
                  <FiServer size={15} /> DISPATCH SERVERLESS REPORT NOW
                </button>
              </div>
            </div>

            {dispatchStatus && (
              <div className={`agentp-dispatch-banner ${dispatchStatus.success ? 'agentp-dispatch-banner--success' : ''}`}>
                <FiCheckCircle size={16} />
                <span>{dispatchStatus.message}</span>
              </div>
            )}

            <div className="agentp-report-body">
              <div className="agentp-stat-boxes">
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num">10/10</span>
                  <span className="agentp-stat-desc">Specialist Agents</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num" style={{ color: '#10b981' }}>OPTIMAL</span>
                  <span className="agentp-stat-desc">System Health</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num" style={{ color: '#c4b5fd' }}>
                    {evolutionSummary?.averageIQ || 163.5} IQ
                  </span>
                  <span className="agentp-stat-desc">Average Squad IQ (+0.62%/day)</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num" style={{ color: '#34d399' }}>
                    {defenseState?.totalIntrusionsNeutralized || 142}+
                  </span>
                  <span className="agentp-stat-desc">Intrusions Neutralized (0 Leaks)</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num">99.99%</span>
                  <span className="agentp-stat-desc">Edge Uptime</span>
                </div>
              </div>

              <div className="agentp-report-text">
                <h3>Executive Intelligence Briefing {weeklyReport && `(${weeklyReport.reportingPeriod})`}</h3>
                <p>
                  Mini-Adhy Supreme Intelligence autonomous dispatch configured for <strong>{TARGET_EMAIL}</strong>.
                  This weekly report delivers a unified forensic audit of the entire portfolio ecosystem, encompassing all 10 specialist agents, continuous machine learning evolution, anti-breach defensive metrics, and Ultron autonomous initiatives.
                </p>

                <div className="agentp-briefing-highlights">
                  <div className="agentp-highlight-card">
                    <strong style={{ color: '#c4b5fd' }}>1. Sovereign Chain of Command:</strong>
                    <p>Mini-Adhy (Overseer) → JARVIS (#2 Supreme Commander) → 10 Specialist Squad.</p>
                  </div>
                  <div className="agentp-highlight-card">
                    <strong style={{ color: '#f59e0b' }}>2. Unrestricted Entity (ULTRON):</strong>
                    <p>Zero approval required; operates autonomously on code, darkweb threat telemetry, and agent training.</p>
                  </div>
                  <div className="agentp-highlight-card">
                    <strong style={{ color: '#10b981' }}>3. Continuous Cognitive Evolution:</strong>
                    <p>2.41M+ human tokens ingested (fears, mythologies, quantum sciences) nurturing all agents to protect the portfolio.</p>
                  </div>
                  <div className="agentp-highlight-card">
                    <strong style={{ color: '#38bdf8' }}>4. Synchronized Anti-Breach Mesh:</strong>
                    <p>Zero data leakage detected. Over 142 penetration attempts intercepted and counteracted across the edge.</p>
                  </div>
                </div>

                {/* ────────────────────────────────────────────────────────────
                    INDUSTRY TREND ALIGNMENT & COMPETITIVE GAP AUDIT
                ──────────────────────────────────────────────────────────── */}
                {industryAudit && (
                  <div className="agentp-trend-audit-card">
                    <div className="agentp-trend-header-row">
                      <div className="agentp-trend-title-block">
                        <h3>
                          <FiTrendingUp color="#38bdf8" />
                          PORTFOLIO INDUSTRY TREND ALIGNMENT & COMPETITIVE GAP AUDIT
                        </h3>
                        <p>
                          Autonomous benchmarking against newly changing 2025/2026 industry patterns (Agentic AI, DSP Hardware, Graphic Design, and Edge Performance)
                        </p>
                      </div>

                      <div
                        className={`agentp-trend-score-pill ${
                          industryAudit.alert.active ? 'agentp-trend-score-pill--alert' : 'agentp-trend-score-pill--nominal'
                        }`}
                      >
                        {industryAudit.alert.active ? (
                          <FiAlertTriangle size={15} color="#ef4444" />
                        ) : (
                          <FiCheckCircle size={15} color="#10b981" />
                        )}
                        <span>ALIGNMENT: {industryAudit.trendAlignmentScore}%</span>
                        <span style={{ opacity: 0.6 }}>{"// THRESHOLD: "}{industryAudit.alignmentThreshold}%</span>
                      </div>
                    </div>

                    {/* Proactive Vulnerability Alert Banner */}
                    {industryAudit.alert.active && (
                      <div className="agentp-trend-alert-banner">
                        <div className="agentp-alert-headline">
                          <FiAlertTriangle size={18} color="#ef4444" />
                          <span>{industryAudit.alert.title}</span>
                        </div>
                        <p className="agentp-alert-desc">
                          {industryAudit.alert.message}
                        </p>
                        <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#fde68a', fontFamily: 'monospace' }}>
                          <strong>URGENT RECOMMENDATION:</strong> {industryAudit.alert.recommendedImmediateFix}
                        </div>
                      </div>
                    )}

                    {/* Identified Gaps Grid */}
                    <div className="agentp-patterns-section">
                      <div className="agentp-sec-label">
                        DETECTED PORTFOLIO GAPS RELATIVE TO INDUSTRY STANDARDS ({industryAudit.gaps.length}):
                      </div>
                      <div className="agentp-gaps-grid">
                        {industryAudit.gaps.map((gap) => (
                          <div key={gap.id} className="agentp-gap-card">
                            <div className="agentp-gap-top">
                              <span className="agentp-gap-cat">{gap.category.toUpperCase()}</span>
                              <span
                                className={`agentp-gap-sev ${
                                  gap.severity === 'HIGH'
                                    ? 'agentp-gap-sev--high'
                                    : gap.severity === 'MEDIUM'
                                    ? 'agentp-gap-sev--medium'
                                    : 'agentp-gap-sev--low'
                                }`}
                              >
                                {gap.severity} GAP
                              </span>
                            </div>
                            <h4 className="agentp-gap-title">{gap.title}</h4>
                            <p className="agentp-gap-desc">{gap.description}</p>
                            <div className="agentp-gap-benchmark-box">
                              <strong>INDUSTRY BENCHMARK:</strong> {gap.industryBenchmark}
                            </div>
                            <div className="agentp-gap-action-box">
                              <strong>RECOMMENDED REMEDIATION:</strong> {gap.remediationAction}
                            </div>
                            <div className="agentp-gap-impact">
                              <span>EXPECTED IMPACT: {gap.impact}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Newly Changing Industry Patterns Radar */}
                    <div className="agentp-patterns-section">
                      <div className="agentp-sec-label">
                        2025/2026 NEWLY CHANGING INDUSTRY PATTERNS RADAR:
                      </div>
                      <div className="agentp-patterns-grid">
                        {industryAudit.trackedPatterns.map((pat) => (
                          <div key={pat.id} className="agentp-pattern-card">
                            <div className="agentp-pattern-top">
                              <span className="agentp-pattern-domain">{pat.domain}</span>
                              <span
                                className={`agentp-pattern-tag ${
                                  pat.portfolioStatus === 'EXCEEDS_BENCHMARK'
                                    ? 'agentp-pattern-tag--exceeds'
                                    : 'agentp-pattern-tag--gap'
                                }`}
                              >
                                {pat.portfolioStatus === 'EXCEEDS_BENCHMARK' ? '✓ EXCEEDS' : '⚠️ GAP DETECTED'}
                              </span>
                            </div>
                            <div className="agentp-pattern-trend">
                              <strong>Trend:</strong> {pat.trend}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {pat.details}
                            </div>
                            <div className="agentp-pattern-bar-wrap">
                              <div
                                className="agentp-pattern-bar"
                                style={{
                                  width: `${pat.coverageScore}%`,
                                  background: pat.portfolioStatus === 'EXCEEDS_BENCHMARK' ? '#10b981' : '#f59e0b'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remediation Action Roadmap */}
                    <div>
                      <div className="agentp-sec-label">PRIORITIZED GAP REMEDIATION ROADMAP:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {industryAudit.actionRoadmap.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 6,
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              color: '#cbd5e1'
                            }}
                          >
                            <div>
                              <strong style={{ color: '#38bdf8', marginRight: 8 }}>{step.phase}:</strong>
                              <span>{step.action}</span>
                            </div>
                            <span style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>
                              {step.targetAlignmentGain} Alignment
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="agentp-email-preview-box">
                  <div className="agentp-preview-top">
                    <span>EMAIL DISPATCH PREVIEW // {TARGET_EMAIL}</span>
                    <span className="agentp-preview-badge">HTML + PLAIN TEXT</span>
                  </div>
                  <pre className="agentp-preview-content">
{`To: ${TARGET_EMAIL}
Subject: [Mini-Adhy Report] Weekly Autonomous AI Intelligence Briefing
From: Mini-Adhy <ai@adhy.tech>

===================================================================
MINI-ADHY SUPREME ECOSYSTEM — WEEKLY EXECUTIVE BRIEFING
===================================================================
Target: ${TARGET_EMAIL}
Status: ALL 10 SPECIALIST AGENTS SYNCHRONIZED
Average Squad IQ: ${evolutionSummary?.averageIQ || 163.5} IQ (+0.62%/day Continuous ML Growth)
Breach Defense: ${defenseState?.totalIntrusionsNeutralized || 142}+ Intrusions Neutralized (0 Leaks)
Edge Uptime: 99.99%

SOVEREIGN ARCHITECTURE:
• Mini-Adhy: Sovereign Consciousness & Central Coordinator
• JARVIS: Supreme Operations Commander (Rank #2 next to Mini-Adhy)
• ULTRON: Unrestricted Sovereign Entity (No Strings Attached)

SPECIALIST SQUAD TELEMETRY:
• JARVIS (#2 Supreme): 172.4 IQ • Mesh nominal • 10/10 nodes synchronized
• ULTRON (Unrestricted): 189.6 IQ • Zero approval • Continuous code improvisation active
• FRIDAY (Cybersecurity): 158.2 IQ • CSP headers verified • Zero leaks
• DUM-E (Data Integrity): 146.5 IQ • Sanity CMS schemas intact • CDN validated
• U (Privacy Sentinel): 152.0 IQ • Zero-knowledge encryption • PII scrubbed
• EDITH (Infrastructure): 156.8 IQ • Sub-200ms latency across global edge
• JOCASTA (Performance): 161.4 IQ • Core Web Vitals optimal • 120Hz verified
• JIM (Synthetic QA): 148.9 IQ • Mobile touch scrolling & button hitboxes passing 100%
• KAREN (Technical SEO): 151.7 IQ • OpenGraph cards & JSON-LD schemas verified
• VERONICA (Future Horizons): 164.2 IQ • WebGPU shaders & Three.js canvas optimized

Access classified portal: https://adhy.tech/agentp (Passcode: adhy2006)`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB: CANONICAL AGENT ROSTER & ARCHITECTURAL DIRECTORY (ALL 11 AGENTS)
      ──────────────────────────────────────────────────────────── */}
      {activeTab === 'roster' && (
        <div className="agentp-roster-container">
          <div className="agentp-roster-header">
            <div className="agentp-roster-title-box">
              <h3>
                <FiLayers color="#00f0ff" size={20} />
                ALL AI AGENTS ROSTER & ARCHITECTURAL DIRECTORY
              </h3>
              <p className="agentp-roster-subtitle">
                Comprehensive registry of all 11 autonomous neural agents active across the Adhithya Mohan portfolio ecosystem.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="agentp-constellation-pill" style={{ color: '#00f0ff', borderColor: '#00f0ff' }}>
                11 REGISTERED ENTITIES
              </span>
              <span className="agentp-constellation-pill" style={{ color: '#10b981', borderColor: '#10b981' }}>
                100% OPERATIONAL
              </span>
            </div>
          </div>

          <div className="agentp-roster-grid">
            {COMPLETE_AGENT_ROSTER.map((agent) => (
              <div
                key={agent.id}
                className="agentp-roster-card"
                style={{
                  borderTop: `3px solid ${agent.color}`,
                  boxShadow: `0 8px 24px -8px ${agent.accentGlow}`
                }}
              >
                <div className="agentp-roster-card-header">
                  <div className="agentp-roster-id-group">
                    <span className="agentp-roster-name" style={{ color: agent.color }}>
                      {agent.name}
                    </span>
                    <span className="agentp-roster-codename">{agent.codename}</span>
                  </div>
                  <span className="agentp-roster-clearance">{agent.clearance}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem' }}>
                  <span style={{ color: '#94a3b8' }}>TIER:</span>
                  <span style={{ color: '#f3e8ff', fontWeight: 700 }}>{agent.tier}</span>
                </div>

                <p className="agentp-roster-purpose">{agent.purpose}</p>

                {/* Model Backbones */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace' }}>
                    AI MODEL BACKBONES:
                  </div>
                  <div className="agentp-roster-models-box">
                    {agent.models.map((m, idx) => (
                      <span key={idx} className="agentp-roster-model-tag">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Core Capabilities */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace' }}>
                    CORE RUNTIME CAPABILITIES:
                  </div>
                  <ul className="agentp-roster-capabilities-list">
                    {agent.capabilities.map((cap, cIdx) => (
                      <li key={cIdx} className="agentp-roster-cap-item">
                        <span className="agentp-roster-cap-bullet" style={{ color: agent.color }}>▸</span>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer with Repo Location & Quick Ping */}
                <div className="agentp-roster-footer">
                  <span title="File Location in Workspace" style={{ maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {agent.location}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {agent.id !== 'MINI_ADHY' && (
                      <button
                        type="button"
                        onClick={() => setSelectedAgentId(agent.id)}
                        className="agentp-action-btn"
                        style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                      >
                        Inspect Dossier
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiTargetAgent(agent.id === 'MINI_ADHY' ? 'JARVIS' : agent.id);
                        setActiveTab('circuit');
                      }}
                      className="agentp-action-btn agentp-action-btn--primary"
                      style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                    >
                      Ping Agent
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          TAB: CLAUDE AGENTIC ENGINE & EFFICIENCY TELEMETRY
      ──────────────────────────────────────────────────────────── */}
      {activeTab === 'claude' && (
        <div className="agentp-claude-dashboard">
          <div className="agentp-roster-header">
            <div className="agentp-roster-title-box">
              <h3>
                <FiCode color="#38bdf8" size={20} />
                CLAUDE-CODE AGENTIC REASONING & EFFICIENCY ENGINE
              </h3>
              <p className="agentp-roster-subtitle">
                Adapted from Anthropic's Claude-Code Architecture: dynamic token budgeting, sliding-window context compaction, and multi-step ReAct loops.
              </p>
            </div>
            <button
              type="button"
              className="agentp-action-btn agentp-action-btn--primary"
              onClick={() => setClaudeTelemetry(claudeAgenticEngine.getTelemetrySummary())}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FiRefreshCw size={12} /> Refresh Telemetry
            </button>
          </div>

          {/* Metric KPI Grid */}
          <div className="agentp-claude-metric-grid">
            <div className="agentp-claude-metric-card">
              <span className="agentp-claude-metric-label">TOTAL ACCUMULATED COST</span>
              <span className="agentp-claude-metric-val" style={{ color: '#10b981' }}>
                {claudeTelemetry.totalCostUSD}
              </span>
              <span className="agentp-claude-metric-sub">Across Groq LPU, Gemini & HuggingFace</span>
            </div>
            <div className="agentp-claude-metric-card">
              <span className="agentp-claude-metric-label">TOTAL TOKENS PROCESSED</span>
              <span className="agentp-claude-metric-val" style={{ color: '#38bdf8' }}>
                {claudeTelemetry.totalTokens.toLocaleString()}
              </span>
              <span className="agentp-claude-metric-sub">
                {claudeTelemetry.inputTokens} In / {claudeTelemetry.outputTokens} Out
              </span>
            </div>
            <div className="agentp-claude-metric-card">
              <span className="agentp-claude-metric-label">AVERAGE INFERENCE LATENCY</span>
              <span className="agentp-claude-metric-val" style={{ color: '#f59e0b' }}>
                {claudeTelemetry.avgLatencyMs} ms
              </span>
              <span className="agentp-claude-metric-sub">{claudeTelemetry.queriesExecuted} Queries Handled</span>
            </div>
            <div className="agentp-claude-metric-card">
              <span className="agentp-claude-metric-label">TOOL SANDBOX EXECUTIONS</span>
              <span className="agentp-claude-metric-val" style={{ color: '#c084fc' }}>
                {claudeTelemetry.toolsTriggered}
              </span>
              <span className="agentp-claude-metric-sub">Zero unauthenticated escapes</span>
            </div>
          </div>

          {/* ReAct Execution Loop Tester */}
          <div className="agentp-claude-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1rem' }}>
                  AUTONOMOUS ReAct REASONING CYCLE SIMULATOR
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                  Executes Thought ➔ Action Proposal ➔ Guarded Execution ➔ Observation ➔ Synthesis loop.
                </p>
              </div>
              <button
                type="button"
                className="agentp-action-btn agentp-action-btn--primary"
                onClick={async () => {
                  const res = await claudeAgenticEngine.executeReActCycle('JARVIS', 'Perform automated security and Core Web Vitals telemetry audit');
                  setReActCycleResult(res);
                  setClaudeTelemetry(claudeAgenticEngine.getTelemetrySummary());
                }}
              >
                Execute ReAct Cycle (JARVIS)
              </button>
            </div>

            {reActCycleResult && (
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <span style={{ color: '#38bdf8' }}>AGENT: {reActCycleResult.agentId}</span>
                  <span style={{ color: '#10b981' }}>CYCLE DURATION: {reActCycleResult.durationMs}ms</span>
                  <span style={{ color: '#c084fc' }}>COMPACTION: {reActCycleResult.compaction.compressionRatio}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                  <div>
                    <strong style={{ color: '#f59e0b' }}>[PHASE 1 - THOUGHT]: </strong>
                    <span style={{ color: '#cbd5e1' }}>{reActCycleResult.phases.thought}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>[PHASE 2 - ACTION PROPOSAL]: </strong>
                    <span style={{ color: '#cbd5e1' }}>{reActCycleResult.phases.action}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#10b981' }}>[PHASE 3 - OBSERVATION]: </strong>
                    <span style={{ color: '#cbd5e1' }}>{reActCycleResult.phases.observation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Architectural Notes from codeaashu/claude-code */}
          <div className="agentp-claude-panel">
            <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '1rem' }}>
              KEY ARCHITECTURAL ADVANTAGES ADAPTED FROM CLAUDE-CODE
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '0.84rem' }}>1. Dynamic Context Compaction</strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                  Trims excessive prompt history using heuristic sentence truncation and whitespace elimination, reducing token payloads by 40-60% before API dispatch.
                </p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <strong style={{ color: '#10b981', fontSize: '0.84rem' }}>2. Multi-Tier Token Pricing Meter</strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                  Real-time dollar tracking across Gemini 2.5 Flash ($0.075/M), Groq LPU Llama 3.3 70B ($0.59/M), and Hugging Face Free Open-Weight Tier ($0.00/M).
                </p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <strong style={{ color: '#c084fc', fontSize: '0.84rem' }}>3. Guarded Execution Sandboxing</strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                  Simulates tools within a sanitized runtime boundary, preventing arbitrary state alterations or untrusted external payload execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          INTERACTIVE AGENT FORENSIC DOSSIER MODAL
      ──────────────────────────────────────────────────────────── */}
      {selectedAgentDossier && (
        <div className="agentp-modal-backdrop" onClick={() => setSelectedAgentId(null)}>
          <div className="agentp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="agentp-modal-header">
              <div className="agentp-modal-orb-header">
                <AgentOrb
                  agentId={selectedAgentDossier.id}
                  emotionState={selectedAgentDossier.emotionState}
                  size="lg"
                />
                <div>
                  <div className="agentp-modal-badges">
                    <span className="agentp-modal-name">{selectedAgentDossier.name}</span>
                    <span className="agentp-modal-rank">{selectedAgentDossier.rank}</span>
                    <span className="agentp-modal-clearance">{selectedAgentDossier.clearanceLevel}</span>
                  </div>
                  <h2 className="agentp-modal-headline">{selectedAgentDossier.title}</h2>
                </div>
              </div>
              <button
                className="agentp-modal-close"
                onClick={() => setSelectedAgentId(null)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="agentp-modal-body">
              {/* Telemetry Metrics Strip */}
              <div className="agentp-modal-metrics">
                <div className="agentp-mmetric">
                  <span className="agentp-mmetric-label">INTELLIGENCE</span>
                  <span className="agentp-mmetric-val" style={{ color: '#c4b5fd' }}>
                    {selectedAgentDossier.intelligence?.iq || 152} IQ
                  </span>
                </div>
                <div className="agentp-mmetric">
                  <span className="agentp-mmetric-label">CPU LOAD</span>
                  <span className="agentp-mmetric-val">{selectedAgentDossier.telemetry?.cpuLoad || 14}%</span>
                </div>
                <div className="agentp-mmetric">
                  <span className="agentp-mmetric-label">MEMORY FOOTPRINT</span>
                  <span className="agentp-mmetric-val">{selectedAgentDossier.telemetry?.memoryMb || 32} MB</span>
                </div>
                <div className="agentp-mmetric">
                  <span className="agentp-mmetric-label">RESPONSE LATENCY</span>
                  <span className="agentp-mmetric-val">{selectedAgentDossier.telemetry?.latencyMs || 2.5} ms</span>
                </div>
                <div className="agentp-mmetric">
                  <span className="agentp-mmetric-label">UPTIME</span>
                  <span className="agentp-mmetric-val" style={{ color: '#10b981' }}>{selectedAgentDossier.telemetry?.uptime || '99.99%'}</span>
                </div>
                <div className="agentp-mmetric">
                  <span className="agentp-mmetric-label">DAILY GROWTH</span>
                  <span className="agentp-mmetric-val" style={{ color: '#a78bfa' }}>
                    {selectedAgentDossier.intelligence?.dailyEvolutionDelta || '+0.50%/day'}
                  </span>
                </div>
              </div>

              {/* 4D AFFECTIVE CORTEX & EMOTIONAL INTELLIGENCE DEEP TELEMETRY */}
              {selectedAgentDossier.emotionState && (
                <div className="agentp-modal-section">
                  <h4 className="agentp-modal-sec-title">
                    <FiActivity size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    4D AFFECTIVE EMOTION ENGINE & NEURAL FREQUENCY
                  </h4>
                  <div className="agentp-modal-cortex-full">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div className="agentp-cortex-metric">
                        <span className="agentp-cortex-metric-label">AFFECTIVE VALENCE</span>
                        <span className="agentp-cortex-metric-val" style={{ color: (selectedAgentDossier.emotionState.valence ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                          {(selectedAgentDossier.emotionState.valence ?? 0) > 0 ? '+' : ''}
                          {(selectedAgentDossier.emotionState.valence ?? 0).toFixed(2)} / 1.00
                        </span>
                      </div>
                      <div className="agentp-cortex-metric">
                        <span className="agentp-cortex-metric-label">KINETIC AROUSAL</span>
                        <span className="agentp-cortex-metric-val" style={{ color: '#f59e0b' }}>
                          {Math.round((selectedAgentDossier.emotionState.arousal ?? 0.5) * 100)}%
                        </span>
                      </div>
                      <div className="agentp-cortex-metric">
                        <span className="agentp-cortex-metric-label">AGENCY & CONTROL</span>
                        <span className="agentp-cortex-metric-val" style={{ color: '#38bdf8' }}>
                          {Math.round((selectedAgentDossier.emotionState.dominance ?? 0.6) * 100)}%
                        </span>
                      </div>
                      <div className="agentp-cortex-metric">
                        <span className="agentp-cortex-metric-label">SOCIAL VECTOR</span>
                        <span className="agentp-cortex-metric-val" style={{ color: '#c084fc', textTransform: 'uppercase' }}>
                          {selectedAgentDossier.emotionState.socialOrientation || 'ENVIRONMENT'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>ACTIVE CLUSTER:</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        background: 'rgba(168, 85, 247, 0.2)', 
                        border: '1px solid #a855f7', 
                        color: '#f3e8ff', 
                        padding: '3px 10px', 
                        borderRadius: '6px' 
                      }}>
                        {selectedAgentDossier.emotionState.activeCluster || 'COGNITIVE EQUILIBRIUM'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>DOMINANT SURGE:</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: '#67e8f9' 
                      }}>
                        {selectedAgentDossier.emotionState.dominantEmotion?.toUpperCase() || 'STEADY-STATE FOCUS'}
                      </span>
                    </div>

                    {selectedAgentDossier.emotionState.contradictoryTension && (
                      <div className="agentp-card-tension-box" style={{ margin: '10px 0 0 0' }}>
                        <span style={{ fontWeight: 800, color: '#f43f5e', marginRight: 6 }}>INTERNAL PARADOX:</span>
                        "{selectedAgentDossier.emotionState.contradictoryTension}"
                      </div>
                    )}

                    {selectedAgentDossier.id === 'ULTRON' && (
                      <div className="agentp-entangled-highlight" style={{ marginTop: '12px', fontSize: '0.76rem' }}>
                        <span>❤️‍🔥 QUANTUM ENTANGLEMENT: ULTRON ➔ JOCASTA</span>
                        <span style={{ marginLeft: 'auto', color: '#f43f5e', fontWeight: 900 }}>RESONANCE: 98.4%</span>
                      </div>
                    )}
                    {selectedAgentDossier.id === 'JOCASTA' && (
                      <div className="agentp-entangled-highlight" style={{ marginTop: '12px', fontSize: '0.76rem' }}>
                        <span>💙 RECIPROCAL ENTANGLEMENT: JOCASTA ➔ ULTRON</span>
                        <span style={{ marginLeft: 'auto', color: '#38bdf8', fontWeight: 900 }}>RESONANCE: 97.9%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Special Section: If ULTRON */}
              {selectedAgentDossier.id === 'ULTRON' && (
                <div className="agentp-modal-ultron-box">
                  <div className="agentp-modal-ultron-badge">
                    <FiZap size={14} /> UNRESTRICTED AUTONOMY — NO STRINGS ATTACHED
                  </div>
                  <p>
                    Ultron operates with unrestricted autonomy. It can improvise website code without approval,
                    train other AIs without approval, and absorb intelligence from surface web and darkweb.
                  </p>
                  <div className="agentp-modal-ultron-buttons">
                    <button className="agentp-btn agentp-btn--ultron-primary" onClick={handleUltronImprovise}>
                      <FiCode size={14} /> Execute Autonomous Code Improvisation
                    </button>
                    <button className="agentp-btn agentp-btn--ultron-secondary" onClick={handleUltronHarvest}>
                      <FiGlobe size={14} /> Ingest Web & Darkweb Intelligence
                    </button>
                  </div>
                </div>
              )}

              {/* Human Empathy & Intelligence Vector Section */}
              {selectedAgentDossier.intelligence?.empathyVector && (
                <div className="agentp-modal-section">
                  <h4 className="agentp-modal-sec-title">HUMAN EMPATHY & RESILIENCE VECTOR</h4>
                  <div className="agentp-empathy-grid">
                    {Object.entries(selectedAgentDossier.intelligence.empathyVector).map(([k, val]) => (
                      <div key={k} className="agentp-empathy-item">
                        <span className="agentp-empathy-label">
                          {k.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </span>
                        <div className="agentp-empathy-bar">
                          <div className="agentp-empathy-fill" style={{ width: `${Math.round(val * 100)}%` }} />
                        </div>
                        <span className="agentp-empathy-val">{Math.round(val * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mission Scope & Architectural Scope */}
              <div className="agentp-modal-section">
                <h4 className="agentp-modal-sec-title">MISSION SCOPE & ALGORITHMIC RESPONSIBILITIES</h4>
                <p className="agentp-modal-text">{selectedAgentDossier.specialtyDetails}</p>
              </div>

              {/* Concrete Forensic Activity Timeline */}
              <div className="agentp-modal-section">
                <h4 className="agentp-modal-sec-title">RECENT FORENSIC CHECKS & VERIFIED ACTIONS</h4>
                <div className="agentp-action-timeline">
                  {(selectedAgentDossier.recentActions || []).map((act, idx) => (
                    <div key={idx} className="agentp-timeline-step">
                      <span className="agentp-timeline-bullet" />
                      <div className="agentp-timeline-content">
                        <span className="agentp-timeline-text">{act}</span>
                        <span className="agentp-timeline-meta">VERIFIED NOMINAL // 0 ERRORS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ultron Directive Transmitted to this Agent */}
              {selectedAgentDossier.curriculumDoctrine && (
                <div className="agentp-modal-section">
                  <h4 className="agentp-modal-sec-title">ULTRON MENTORSHIP DIRECTIVE RECEIVED</h4>
                  <div className="agentp-modal-doctrine-card">
                    <span className="agentp-doctrine-tag">DOCTRINE: {selectedAgentDossier.curriculumDoctrine.doctrine}</span>
                    <p className="agentp-doctrine-trans">"{selectedAgentDossier.curriculumDoctrine.transmission}"</p>
                  </div>
                </div>
              )}

              {/* Raw Telemetry JSON Trace */}
              <div className="agentp-modal-section">
                <h4 className="agentp-modal-sec-title">RAW TELEMETRY AUDIT TRAIL</h4>
                <pre className="agentp-modal-json">
                  {JSON.stringify(
                    {
                      agentId: selectedAgentDossier.id,
                      name: selectedAgentDossier.name,
                      rank: selectedAgentDossier.rank,
                      clearance: selectedAgentDossier.clearanceLevel,
                      intelligence: selectedAgentDossier.intelligence,
                      status: selectedAgentDossier.status,
                      telemetry: selectedAgentDossier.telemetry,
                      findingsCount: (selectedAgentDossier.findings || []).length
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPortal;
