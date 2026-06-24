# AI Agent Memory

This file serves as a persistent memory for the AI agent to track context, tasks, and state across interactions without needing to re-read all files.

## Current Context
- Project: Portfolio Web App
- Current Focus: Styling and Components (`GravityWell.css`, `ParticlesBackground.css`, etc.)

## Tasks
- [x] Traverse through the whole directory and eliminate flaws, dead ends, dummy files, and loose connections. 
  - Ran a custom Python script to identify orphaned React components and CSS files.
  - Eliminated over 25+ unused components and styling files (Resume, ThemeToggle, Header, AmbientThoughts, DarkModeToggle, DeveloperConsole, DigitalTextures, FluidCanvas, GitHubStats, HardwareNexus, ParticlesBackground, PingPongGame, QuoteCanvas, SmoothScroll, ColorMorphText, ShapeMorph, OpticGlass).
- [x] Provided strategic suggestions for evolving the website into a Professional Society platform.
- [x] Designed and integrated `ExecomFlipCard.tsx` client component to provide an elegant 3D flip animation for ExeCom member cards revealing their LinkedIn and Instagram/Portfolio links. The structure and performance hooks of the existing `app/page.tsx` remain preserved.
- [ ] Maintain and update this memory file after every interaction.
- [ ] Review this file before executing any new prompts.

## Notes
- The focus is pivoting towards building/enhancing a "Professional Society Website" (likely tying into the ISTE-WEBSITE context). I need to ensure suggestions align with enterprise, community, and membership-driven architectures.
- Remember to check this file for established context before proceeding with new user requests.

## Backend Wiring & Data Pipelines

### Internship Engine (v7.0) Ecosystem
- **Scraping Pipeline (`v12_backend/pipeline_engine.py`)**: Uses an `AsyncScraper` (Playwright Stealth + JobSpy) to fetch jobs. Fingerprints pages using MD5 (URL) and SHA256 (body) stored in **Redis** (`hash:page:content:{url_md5}`) with a 7-day TTL to prevent redundant processing.
- **Data Merger & Storage**: Uses a PostgreSQL database (`CanonicalMerger`) to deduplicate internships via canonical hashing.
- **Sanity Synchronization (`v12_backend/sanity_sync.py`)**: A `SanitySyncEngine` asynchronously pushes records to Sanity CMS (v12.1 schema: `_id`, `_type`, `title`, `company`, `location`, `url`, `stipend`) utilizing exponential backoff and rate limit handling (429s).
- **Core AI Agents (`INTERNSHIP_ENGINE_REPORT.md`)**:
  - **AuthenticityAgent**: Scans for counterfeit keywords (e.g., "laptop deposit", "training fee") and checks for link rot (403/404).
  - **SemanticIntelligenceAgent**: PyTorch `SentenceTransformer` (`all-MiniLM-L6-v2`) maps domain embeddings. Uses Regex for stipend extraction.
  - **QualityAssessmentAgent**: Applies Geographic Proximity Scoring (+30 Trivandrum, +15 Kochi). An Adaptive Neural Core (PyTorch) predicts "Survival Probability." Uses `facebook/bart-large-mnli` (Supreme Judge) for borderline ties.
  - **SanityCleanupAgent**: Live CMS pruning. Updates `EvolutionMemory` SQLite to teach the Neural Core from flagged/failed internships.

### Autonomous ATS Resume Analyzer & Auto-Grader
- **PortfolioAssessmentAgent**: Scrapes student public GitHub repos, performs mock AST analysis (code size, languages, complexity), and matches coding style against elite internships.
- **ResumeOptimizationAgent**: NLP-based system that accepts a base resume and dynamically scores, reorders, and rewrites bullet points to align perfectly with the target job's semantic embedding to bypass corporate ATS filters.

### Automated Cron Jobs & Predictive Intelligence
- **Predictive Hiring Trajectory**: A local `VelocityLSTM` PyTorch time-series model runs continuously to analyze posting velocity (e.g., rapid bursts from a single company) to predict mass-hiring sprees before they are public.
- The `pipeline_engine.py` script and Celery task queues are orchestrated (via `docker-compose.yml`) to ingest continuous streams of data and trigger the `SanitySyncEngine` autonomously.

## The 60-Engine Architecture (Living Website Blueprint)
The platform is built as a "Digital Organism" containing sub-engines that monitor, react, and defend autonomously.

### Core Biological Stack
- **The Brain (Frontal Lobe)**: Next.js App Router & React 19 handling SSR memory and client reflexes. 
- **Long-Term Memory (Hippocampus)**: PostgreSQL via Prisma ORM.
- **Hypothalamus**: Sanity Headless CMS feeding directly to Next.js via webhooks.
- **Physics & Aesthetics**: Pure CSS 3D (`preserve-3d`), hardware acceleration, and GSAP/Framer prioritizing 60FPS fluid motion without blocking the main JS thread.

### Live Sub-Systems (`app/brain/*`)
- **Central Nervous System (`BrainProvider.tsx`)**: Global context utilizing `requestAnimationFrame` to monitor real-time FPS, scroll velocity, and active engine states. It autonomously throttles background animations if FPS drops below 30.
- **Senses & Reflexes (`MagneticCursor.tsx` / `HapticEngine`)**: Custom physics-based pointer leveraging linear interpolation (LERP). Reacts to DOM hover states, dynamically pre-fetches routes, and triggers device vibrations.
- **The Immune System (`SecurityGuardian.tsx`)**: Cybersecurity layer active in the DOM capture phase to intercept right-clicks, block DevTools (F12, Ctrl+Shift+I), and prevent text scraping. Triggers a red-flash UI "Stress Response" upon intrusion.
- **The Soul (`AtmosphereEngine` / CSS Nucleus)**: A dynamically shifting 3D CSS Nucleus and an invisible, low-frequency sub-audible hum (Web Audio API) that shifts pitch relative to the user's scroll speed.

## Internship Launchpad (v10.2 Autonomous Intelligence Ecosystem)
The Internship Launchpad operates as a massive decoupled state machine handling live data from Python scrapers to Sanity presentation, and tracking user applications via PostgreSQL.

### 1. The Python Engine (`internship_engine_v8.py`)
- **Discovery**: Utilizes `jobspy` (Infinite Aggregator) and Playwright to crawl Tier A tech, LinkedIn, Glassdoor, and Indeed.
- **SQLite Brain (`internship_brain_v8.db`)**: The absolute source of truth. Features a State Machine: `NEW` -> `ACTIVE` -> `VERIFIED`. Dead links decay to `SUSPECT` and eventually `ARCHIVED`. Stale data is cryptographically hidden but preserved for ML training.
- **Verification Gate**: Performs HTTP status checks and NLP expiry phrase detection (e.g., "This position has been filled"). Computes a `linkHealthScore`. Executes a non-destructive `"patch"` mutation to Sanity CMS to protect manual human edits (like company logos).
- **Scam Detection & Reinforcement**: Uses keyword heuristics (`SCAM_SIGNALS`) and dynamically adjusts trust scores of hiring platforms based on historical reliability.

### 2. Next.js Presentation Layer
- **Strict GROQ Gate**: `*[_type == "internship" && state == "VERIFIED" && verificationStatus == "VERIFIED"]` ensuring only elite, live internships are rendered.
- **Sub-Minute Ghost Record Purging**: Uses Time-Based ISR (`revalidate: 60`) to instantly wipe decayed/archived internships from the CDN.

## ISTE Member Portal Blueprint (PostgreSQL Core)
The primary focus of the platform is delivering extreme value to the 300+ annual student members through a highly-gated, cinematic digital hub, exclusively utilizing PostgreSQL and Prisma.

### Database Architecture (Prisma)
- **`Member` Table**: Core identity tracking `email`, `passwordHash`, `fullName`, `branch`, `semester`, and `clearance` level.
- **`Event` & `Attendance` Tables**: Relational mapping to track exact events attended by members and their associated `certificateUrl` artifacts.

### The Dashboard Features
- **3-Stage Onboarding**: Standard Login -> Forced Initialization (if profile is incomplete) -> The Identity Matrix Dashboard.
- **The Vault**: A strictly gated resource hub holding premium workshop PDFs, roadmaps, and unlisted recordings.
- **Activity Stream**: A chronological timeline of the member's event history and instantly downloadable certificates.
- **The Elite Radar**: A private UI component that surfaces the top 1% of internships from the Python ML engine exclusively to logged-in members.
