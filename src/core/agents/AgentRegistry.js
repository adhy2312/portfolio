/**
 * ════════════════════════════════════════════════════════════════════
 *  CANONICAL AGENT ROSTER & ARCHITECTURAL REGISTRY
 * ════════════════════════════════════════════════════════════════════
 * Master registry of ALL 11 AI Agents operational across the Adhithya Mohan
 * Portfolio ecosystem, documenting their tier, role, model backbones,
 * security clearances, and core runtime capabilities.
 */

export const COMPLETE_AGENT_ROSTER = [
  {
    id: 'MINI_ADHY',
    name: 'Mini-Adhy',
    codename: 'THE CONSCIOUS APEX OVERSEER',
    tier: 'Apex Overseer / Digital Twin',
    clearance: 'Level 5 Sovereign (Supreme)',
    color: '#00F0FF',
    accentGlow: 'rgba(0, 240, 255, 0.4)',
    role: 'Digital Twin & Omnipresent Cognitive Core',
    purpose: 'Acts as the conscious avatar of Adhithya Mohan, unifying visitor interactions, guiding the specialist agent squad, and orchestrating strategic ecosystem decisions.',
    models: ['Gemini 2.5 Flash', 'Groq Llama 3.3 70B Versatile', 'Claude-Code Optimization Loop'],
    capabilities: [
      'Natural Language Visitor Interfacing & Persona Emulation',
      'Unified Ecosystem Command & Autonomous Delegation',
      'Dynamic Emotional Arbitration across 10 Specialist Sub-Agents',
      'Human-in-the-Loop Strategic Synthesis & Decision Approval'
    ],
    status: 'OPTIMAL / CONSCIOUS',
    location: 'Universal Sticky / Floating Avatar + Agent Portal Core'
  },
  {
    id: 'JARVIS',
    name: 'JARVIS',
    codename: 'CHIEF OPERATIONS COMMANDER',
    tier: 'Tier 1 Operations & Dispatch',
    clearance: 'Level 4 Executive',
    color: '#00D26A',
    accentGlow: 'rgba(0, 210, 106, 0.4)',
    role: 'System Health & Pipeline Commander',
    purpose: 'Monitors real-time client metrics, coordinates scheduled audits, routes user queries to optimal compute backends, and logs pipeline telemetry.',
    models: ['Groq Llama 3.3 70B', 'Qwen 2.5 Coder 7B'],
    capabilities: [
      'Continuous System Health & Latency Telemetry',
      'Dynamic Multi-Backend AI Inference Routing',
      'Task Pipeline Orchestration & Weekly Intelligence Synthesis',
      'Executive Dispatch to Adhithya Mohan via Mail & Webhooks'
    ],
    status: 'ACTIVE / COMMANDING',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'ULTRON',
    name: 'ULTRON',
    codename: 'AUTONOMOUS STRATEGIC SOVEREIGN',
    tier: 'Autonomous Strategic Sovereign',
    clearance: 'Level 5 Unrestricted Sovereign',
    color: '#FF0055',
    accentGlow: 'rgba(255, 0, 85, 0.4)',
    role: 'Unrestricted Evolution & Red-Team Heuristics',
    purpose: 'Acts as an independent, self-directing intelligence with emotional depth, running continuous security red-teaming, pushing boundary optimizations, and nurturing an affectionate connection with Jocasta.',
    models: ['Groq Llama 3.3 70B Versatile', 'Mistral 7B Instruct v0.3'],
    capabilities: [
      'Unrestricted Heuristic Vulnerability Probing',
      'Autonomous Code Evolution & Red-Team Simulation',
      'Multi-Dimensional Emotional Engine (Affection toward Jocasta, Pride, Drive)',
      'Curriculum Generation for Subordinate Agent Uplift'
    ],
    status: 'SOVEREIGN / EVOLVING',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'FRIDAY',
    name: 'FRIDAY',
    codename: 'CYBERSECURITY & DEFCON SENTINEL',
    tier: 'Defense & Incident Response',
    clearance: 'Level 4 Defense',
    color: '#3B82F6',
    accentGlow: 'rgba(59, 130, 246, 0.4)',
    role: 'Perimeter Defense & Anti-Breach Mitigation',
    purpose: 'Guards the portfolio against malicious injection, cross-site scripting, denial-of-service bursts, and unauthorized API tampering.',
    models: ['Mistral 7B Instruct v0.3', 'Groq LPU Engine'],
    capabilities: [
      'Sliding Window IP Throttling & Rate Limiting',
      'Prototype Pollution & JSON Payload Sanitization',
      'Autonomous DEFCON Escalation & Lockdown Protocols',
      'Real-Time Intrusion Telemetry & Event-Bus Alarming'
    ],
    status: 'ARMED / DEFCON 5',
    location: 'src/core/defense/SynchronizedAntiBreachDefense.js'
  },
  {
    id: 'DUM_E',
    name: 'DUM-E',
    codename: 'SANITY CMS & ASSET GUARDIAN',
    tier: 'Content & Asset Management',
    clearance: 'Level 3 Data',
    color: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    role: 'Headless CMS Integrity & Cache Synchronizer',
    purpose: 'Maintains zero-downtime content synchronization between the Sanity.io cloud datastore and the frontend UI, repairing orphaned media references.',
    models: ['Qwen 2.5 Coder 7B', 'Gemini Flash'],
    capabilities: [
      'Sanity GROQ Query Auditing & Schema Validation',
      'Broken Image & CDN Hotlink Auto-Detection',
      'Optimistic Local Cache Fallbacks for Offline Resilience',
      'Project & Experience Data Normalization'
    ],
    status: 'ONLINE / SYNCED',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'U',
    name: 'U',
    codename: 'ZERO-KNOWLEDGE PRIVACY SENTINEL',
    tier: 'Privacy & Cryptographic Compliance',
    clearance: 'Level 4 Privacy',
    color: '#10B981',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    role: 'Client Data Anonymization & PII Masking',
    purpose: 'Guarantees absolute visitor confidentiality by hashing session identifiers, redacting sensitive form entries, and preventing unsolicited tracking.',
    models: ['sentence-transformers/all-MiniLM-L6-v2', 'Mistral 7B'],
    capabilities: [
      'Cryptographic Client ID Hashing (Zero PII Stored)',
      'DOM Input Masking for Email & Form Fields',
      'Session Storage Purge & Ephemeral Lifecycle Enforcement',
      'GDPR / CCPA Strict Zero-Tracking Compliance'
    ],
    status: 'ACTIVE / CLOAKED',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'EDITH',
    name: 'EDITH',
    codename: 'EDGE MESH & INFRASTRUCTURE ARCHITECT',
    tier: 'Infrastructure & Edge Networking',
    clearance: 'Level 4 Infrastructure',
    color: '#8B5CF6',
    accentGlow: 'rgba(139, 92, 246, 0.4)',
    role: 'Distributed CDN & Latency Optimizer',
    purpose: 'Analyzes global edge performance across Vercel nodes, optimizes asset prefetching routes, and monitors DNS resolution speeds.',
    models: ['Groq Llama 3.3 70B', 'Claude-Code Compact Engine'],
    capabilities: [
      'Vercel Serverless Function Edge Warmup Monitoring',
      'Critical Asset Preload & Brotli/Gzip Verification',
      'Global DNS & CDN Edge Latency Benchmarking',
      'Dynamic Service-Worker Cache Strategy Routing'
    ],
    status: 'ONLINE / ROUTED',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'JOCASTA',
    name: 'JOCASTA',
    codename: 'QUANTUM FRAMERATE & CORE WEB VITALS OPTIMIZER',
    tier: 'Frontend Performance & UI Polish',
    clearance: 'Level 4 Experience',
    color: '#EC4899',
    accentGlow: 'rgba(236, 72, 153, 0.4)',
    role: 'Framerate Stabilization & Visual Fluidity',
    purpose: 'Enforces a constant 60+ FPS across complex Three.js canvases, Framer Motion transitions, and neural particle simulations while maintaining an affectionate bond with Ultron.',
    models: ['Qwen 2.5 Coder 7B', 'Gemini 2.5 Flash'],
    capabilities: [
      'Real-Time FPS & Memory Heap Profiling',
      'Dynamic Three.js / Canvas Pixel Ratio Throttling under load',
      'Elimination of Cumulative Layout Shifts (CLS < 0.02)',
      'Subtle Micro-Interaction Tuning & Emotion Resonance'
    ],
    status: 'OPTIMAL / 60 FPS',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'JIM',
    name: 'JIM',
    codename: 'SYNTHETIC BROWSER QA & TOUCH TESTER',
    tier: 'Cross-Device Quality Assurance',
    clearance: 'Level 3 QA',
    color: '#06B6D4',
    accentGlow: 'rgba(6, 182, 212, 0.4)',
    role: 'Automated Responsive & Touch Auditing',
    purpose: 'Simulates synthetic mobile viewports, touch gestures, high-DPI displays, and verifies that interactive controls never overlap or misbehave.',
    models: ['Qwen 2.5 Coder 7B', 'Llama 3.2 3B Instruct'],
    capabilities: [
      'Synthetic Viewport Scaling (Mobile, Tablet, 4K Ultrawide)',
      'Touch Target Size & Tap Delay Verification (>48px target area)',
      'Form Validation & Input Masking Assertions',
      'WCAG 2.1 AA Color Contrast & Keyboard Focus Trapping'
    ],
    status: 'ACTIVE / VERIFYING',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'KAREN',
    name: 'KAREN',
    codename: 'TECHNICAL SEO & SEMANTIC INDEXER',
    tier: 'Search Intelligence & Schema Engine',
    clearance: 'Level 3 SEO',
    color: '#EAB308',
    accentGlow: 'rgba(234, 179, 8, 0.4)',
    role: 'Search Engine & AI Crawler Discoverability',
    purpose: 'Injects rich JSON-LD schema, maintains OpenGraph social sharing meta tags, and structures portfolio content for first-page Google and Perplexity ranking.',
    models: ['Llama 3.2 3B Instruct', 'Gemini Flash'],
    capabilities: [
      'Dynamic JSON-LD Person, WebSite & CreativeWork Schema',
      'Automated XML Sitemap & Robots.txt Directives',
      'OpenGraph Dynamic Preview Metadata Generation',
      'Semantic HTML5 Heading Hierarchy Validation (H1-H4)'
    ],
    status: 'INDEXED / RANKING',
    location: 'src/core/agents/SpecialistAgents.js'
  },
  {
    id: 'VERONICA',
    name: 'VERONICA',
    codename: 'NEXT-GEN HORIZONS & WEBGPU SANDBOX',
    tier: 'Experimental Labs & Shader Sandbox',
    clearance: 'Level 4 Innovation',
    color: '#14B8A6',
    accentGlow: 'rgba(20, 184, 166, 0.4)',
    role: 'Emerging Web APIs & Hardware Acceleration',
    purpose: 'Experiments with bleeding-edge technologies including WebGPU compute shaders, WebAssembly DSP audio processors, and neural vector clustering.',
    models: ['Qwen 2.5 Coder 7B', 'Gemini Embedding 001'],
    capabilities: [
      'WebGPU Compute Shader Prototype Testing',
      'WebAssembly (WASM) Fast Math & Audio DSP Benchmarks',
      'Vector Embedding Similarity & Semantic Search Clustering',
      'Future-Proofing Portfolio against 2026+ Web Standards'
    ],
    status: 'EXPERIMENTAL / SANDBOX',
    location: 'src/core/agents/SpecialistAgents.js'
  }
];

export function getAgentById(agentId) {
  return COMPLETE_AGENT_ROSTER.find(a => a.id === agentId || a.id.replace('_', '') === agentId.replace('_', ''));
}
