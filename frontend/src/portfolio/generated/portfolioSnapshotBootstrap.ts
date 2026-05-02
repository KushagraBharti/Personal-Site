import type { PortfolioSnapshot } from "../api/contracts";

export const portfolioSnapshotBootstrap: PortfolioSnapshot = {
  "generatedAt": "generated-at-build-time",
  "profile": {
    "name": "Kushagra Bharti",
    "headline": "Student | Software Engineer | ML Enthusiast",
    "personalSummary": "An aspiring founder, but right now I am focused on building my skills and learning.",
    "primaryEmail": "kushagrabharti@gmail.com",
    "socialLinks": [
      {
        "label": "Email",
        "href": "mailto:kushagrabharti@gmail.com"
      },
      {
        "label": "LinkedIn",
        "href": "https://www.linkedin.com/in/kushagra-bharti/"
      },
      {
        "label": "GitHub",
        "href": "https://github.com/kushagrabharti"
      },
      {
        "label": "Medium",
        "href": "https://medium.com/@kushagrabharti"
      },
      {
        "label": "X",
        "href": "https://x.com/IamKushagraB"
      }
    ],
    "externalLinks": [
      {
        "label": "Film Portfolio",
        "href": "https://drive.google.com/file/d/1m3aFLAK4TE29ybbdOzObLS8zrrX3oJwM/view?usp=sharing"
      }
    ]
  },
  "about": {
    "introHeading": "Hey there! I'm Kushagra Bharti",
    "introBody": "An aspiring founder, but right now I am focused on building my skills and learning.",
    "currentProjects": [
      "Monopoly Bench - A platform where various LLMs can play Monopoly against each other; I plan to publish a paper connected to this work.",
      "A light-weight web crawler in Go - A project I am using to learn Go, concurrency, networking performance, and resource management.",
      "An open-source T3.chat app - A project I am using to sharpen my web development skills, try creative chat UX ideas, and eventually integrate my web crawler as a tool."
    ],
    "currentLearning": [
      "Go, especially concurrency.",
      "WebSockets and real-time applications.",
      "Machine learning fundamentals.",
      "LLMs, including tool-calling and context management.",
      "Networking performance.",
      "Resource management.",
      "Data management."
    ],
    "interestsOutsideTechnology": [
      "I love cooking and have been cooking since I was five years old.",
      "I love filmmaking, have directed 2 short films, and have contributed to other productions as a videographer and editor.",
      "I love sports, especially soccer, volleyball, tennis, and table tennis, and I also follow soccer, Formula 1, and the UFC.",
      "I am interested in psychology, reading, and the arts."
    ]
  },
  "intro": {
    "personalPhoto": "/portfolio/profile/headshot.png",
    "latestUpdate": "Currently applying for Summer 2026 internships",
    "funFact": "A film I made was screened at AMC Theatres in Times Square!",
    "featuredRead": {
      "title": "The Trillion Dollar AI Software Development Stack",
      "link": "https://a16z.com/the-trillion-dollar-ai-software-development-stack/"
    },
    "aiProjects": [
      "Pseudo-Lawyer",
      "CircuitSeer",
      "DataDrive"
    ],
    "travelPlans": "Visiting Home for summer break!"
  },
  "education": [
    {
      "slug": "ut-dallas-bs-computer-science",
      "order": 1,
      "dateRange": "2023 - Present",
      "position": "Student at University of Texas at Dallas",
      "focus": "BS in Computer Science with focus on Data and Machine Learning.",
      "description": "Learning about data structures, algorithms, and machine learning models to develop software applications and systems. Participating in hackathons and coding competitions to enhance problem-solving skills and gain practical experience in software development.",
      "schoolLink": "https://cs.utdallas.edu/education/undergraduate-studies/"
    },
    {
      "slug": "st-stephens-episcopal-school",
      "order": 2,
      "dateRange": "2019 - 2023",
      "position": "Student at St. Stephen's Episcopal School",
      "focus": "High School Diploma with focus on Computer Science and Mathematics.",
      "description": "Learnt computer science and math",
      "schoolLink": "https://www.sstx.org/boarding/boarding-student-support"
    }
  ],
  "experiences": [
    {
      "slug": "ut-dallas-undergraduate-researcher-optimization",
      "order": 1,
      "dateRange": "2024 - Present",
      "category": "Research",
      "timelineTone": "active",
      "position": "Undergraduate Researcher at UT Dallas (supervised by Prof. Ovidiu Daescu)",
      "summary": "Building paper-faithful optimization solvers and a solver-labeled dataset pipeline for 1D drone coverage planning, with benchmarks + QC gates to support supervised learning, GNN, and RL experiments on optimal tour planning.",
      "description": [
        "Implemented 4 paper-faithful solvers for 1D drone coverage planning (greedy + DP), including exact plan reconstruction (cost → tours) for solver-faithful labeling.",
        "Built an end-to-end data pipeline (instance generation → gold labels → featurization hooks → QC), enabling ML training on optimal solutions rather than heuristics.",
        "Measured labeling throughput on a verified run: 370 labeled instances in 2.71s (~136 samples/s), writing ~280KB (~759B/sample), with QC PASS validating constraints end-to-end.",
        "Configured dataset defaults targeting 67,000 labeled samples across splits (train/test/shifted/extrap/stress) for generalization + distribution-shift evaluation.",
        "Benchmarked solver performance and scaling: dp_full stays <1s up to n=1024 segments and reaches n=4096 in 8.41s, bounding exact-label generation cost for larger datasets.",
        "Maintained CI-ready correctness gates: 162 tests collected (152 pass in 1.15s), including 22 plan round-trip tests and 4 oracle cross-checks."
      ],
      "tags": [
        "Optimization",
        "Algorithms",
        "Dynamic Programming",
        "Greedy Algorithms",
        "Computational Geometry",
        "Coverage Planning",
        "Path Planning",
        "Drone Routing",
        "Exact Algorithms",
        "Dataset Generation",
        "Programmatic Labeling",
        "Featurization Pipelines",
        "Data QC / Validation",
        "Benchmarking",
        "Reproducible Research",
        "Python",
        "NumPy",
        "Pytest",
        "JSONL",
        "PyTorch",
        "Ruff",
        "Black",
        "Mypy",
        "Hypothesis",
        "Pygame (visualization)"
      ],
      "companyLink": "https://personal.utdallas.edu/~daescu/"
    },
    {
      "slug": "ut-dallas-undergraduate-researcher-monopolybench",
      "order": 2,
      "dateRange": "2024 - Present",
      "category": "Research",
      "timelineTone": "active",
      "position": "Undergraduate Researcher at UT Dallas (mentored by PhD Candidate Parth Padalkar)",
      "summary": "Built a deterministic, replayable Monopoly benchmark where LLMs play head-to-head via schema-typed tool calls, enabling research on long-horizon planning, negotiation/deception, and bias under fully logged, inspectable runs.",
      "description": [
        "Built MonopolyBench: deterministic rules engine + LLM arena + telemetry + live UI, designed for reproducible benchmarking and dataset generation from full-game trajectories.",
        "Constrained LLM actions to schema-typed legal moves (19 action variants, 11 decision types; 31 event types) and enforced strict validation with exactly one corrective retry + deterministic fallback.",
        "Proved determinism and replayability: identical seeds reproduce identical canonical event traces (e.g., 454 events), and robust replay matches 20/20 runs when stepping to decision boundaries.",
        "Logged research-grade artifacts for inspection and analysis: 631/631 decisions have complete traces (prompt → tools → raw response → parsed action → applied events) with 100% prompt artifact completeness.",
        "Measured run footprint for scaling: ~1.25MB p50 and ~217 files/run across 20 runs (events/decisions/actions/state/prompts/summary), supporting large-scale batch evaluation.",
        "Defined research directions: win-rate ranking across models, long-horizon planning evaluation, negotiation/bluffing/deception via public vs private messages, and bias probing via controlled player descriptors; roadmap includes TrueSkill + micro-decision suites."
      ],
      "tags": [
        "Deterministic Simulation",
        "Event Sourcing",
        "Replayable Benchmarks",
        "Contracts-First Design",
        "Schema-Driven Protocols",
        "Multi-Agent Systems",
        "LLM Evaluation",
        "Tool Calling / Function Calling",
        "LLM Orchestration",
        "Strict Validation",
        "Bounded Retry Policy",
        "Deterministic Fallbacks",
        "Telemetry / Run Artifacts",
        "JSONL Event Logs",
        "Python",
        "FastAPI",
        "WebSockets",
        "Uvicorn",
        "Pydantic",
        "httpx",
        "orjson",
        "jsonschema",
        "python-dotenv",
        "uv (Python workspace)",
        "Pytest",
        "Ruff",
        "Mypy",
        "TypeScript",
        "React",
        "Vite",
        "Tailwind CSS",
        "Zustand",
        "Zod",
        "Framer Motion",
        "AJV",
        "Contract Validation",
        "ESLint",
        "Prettier"
      ],
      "companyLink": "https://github.com/KushagraBharti/MonopolyBench"
    },
    {
      "slug": "consult-your-community",
      "order": 3,
      "dateRange": "2023 - 2024",
      "category": "Consulting",
      "timelineTone": "past",
      "position": "Consultant at Consult Your Community (Club)",
      "summary": "Led data analytics to transform multi-source data into actionable insights.",
      "description": [
        "Led data strategy for Made2Polish, architecting & deploying an end-to-end analytics solution (React, Flask, Python, Looker Studio) translating raw multi-source data (sales, inventory, social) into actionable business insights.",
        "Delivered strategic recommendations based on data analysis (e.g., content performance, customer segmentation, inventory forecasting), directly informing client decisions on retail expansion, production scaling, and competitive pricing.",
        "Engineered and presented a \"Data Source Strategy Map\" and interactive dashboards that centralized multi-platform KPIs, enabling the client to identify key revenue drivers and optimize marketing spend."
      ],
      "tags": [
        "Data Analytics",
        "Python",
        "Flask",
        "Looker Studio"
      ],
      "companyLink": "https://www.utdcyc.com/"
    },
    {
      "slug": "abilitie-software-engineering-intern",
      "order": 4,
      "dateRange": "2024",
      "category": "Industry",
      "timelineTone": "past",
      "position": "Software Engineering Intern at Abilitie",
      "summary": "Worked on a production role-play chatbot by benchmarking model choices, running prompt/model experiments, adding inference telemetry, and shipping performance + UI reliability improvements.",
      "description": [
        "Reduced LLM cost per conversation by ~70% by supporting a production migration from GPT-4-32k → GPT-4o and further cutting prompt tokens per request by ~20% and retries by ~8% while maintaining role-play quality.",
        "Ran a structured optimization loop across 27 configurations (3 scenarios × 3 models × 3 system prompts), using a rubric + human review to improve instruction-following and reduce out-of-format outputs to ~5%; included prompt-injection testing and hardening iterations.",
        "Built a DynamoDB-backed telemetry pipeline (request + stream summary events) capturing TTFT/TTLT, tokens/sec, token counts, retries, error categories, provider/model metadata, and per-request tracing; used it to identify bottlenecks and drive ~10% latency improvement and ~95% completion success rate.",
        "Improved perceived responsiveness via a 3s idle prefetch path (send full prompt in the background; cancel/discard if the user continues typing) plus a 2-retry + timeout policy; reduced TTFT after Enter to p50/p95 ≈ 0.5s/1.5s without sacrificing streaming reliability.",
        "Extended inference plumbing to support experimentation with multiple model families (e.g., GPT-4/GPT-4o, Claude-class, Llama-class), standardizing request/response handling and logging to make comparisons apples-to-apples across providers/models.",
        "Implemented output-quality guardrails including a lightweight NSFW/vulgarity detection filter to enforce professional responses and reduce unsafe or unprofessional generations in customer-facing role-play flows.",
        "Processed and transformed ~1.6M chat turns into training-ready JSONL using custom Python scripts to support instruction-style fine-tuning workflows on AWS (SageMaker/Bedrock), improving response consistency for targeted role-play behaviors.",
        "Shipped product-facing UI/UX fixes in React + TypeScript + Material UI, including theme-aware rich-text paste sanitization (mapping Google Docs colors to theme palette tokens) to eliminate dark-mode invisibility and improve accessibility across internal admin tooling and AI Cases workflows."
      ],
      "tags": [
        "LLMs",
        "Prompt Engineering",
        "Evaluation",
        "Telemetry",
        "DynamoDB",
        "AWS",
        "React",
        "TypeScript"
      ],
      "companyLink": "https://www.abilitie.com/"
    },
    {
      "slug": "st-stephens-dorm-proctor",
      "order": 5,
      "dateRange": "2021 - 2022",
      "category": "Leadership",
      "timelineTone": "past",
      "position": "Dorm Proctor at St. Stephen's Episcopal School",
      "summary": "Guided and supported students in their transition to boarding school life.",
      "description": [
        "Supported new students in their transition to boarding school, helping them adjust to routines and environment through active guidance and personalized support.",
        "Provided peer counseling on academics, personal issues, and social challenges, leveraging professional training from licensed counselors and therapists to ensure sensitive, effective support.",
        "Collaborated closely with dorm parents, administrators, and counselors to proactively maintain a safe, welcoming, and inclusive dorm environment, promoting a sense of belonging.",
        "Completed extensive safety training, including fire and emergency protocols, enabling preparedness for campus-wide safety and quick response in emergencies.",
        "Demonstrated strong time-management skills by balancing proctor responsibilities with academics, achieving a high standard of commitment to both roles.",
        "Went above and beyond to be a trusted resource for students, checking in regularly and addressing individual needs with empathy, fostering a positive and supportive community."
      ],
      "tags": [
        "Mentorship",
        "Counseling",
        "Time Management",
        "Safety Training"
      ],
      "companyLink": "https://www.sstx.org/boarding/boarding-student-support"
    }
  ],
  "projects": [
    {
      "slug": "monopoly-llm-benchmark",
      "order": 1,
      "title": "Monopoly LLM Benchmark Platform",
      "summary": "A deterministic, inspectable multi-agent AI simulation where large language models play full Monopoly games under strict rules, enabling reproducible benchmarking, debugging, and research into strategic reasoning and negotiation.",
      "description": [
        "Designed and implemented a full Monopoly game engine from scratch with complete rule coverage—including auctions, trading, jail mechanics, building constraints, liquidation, and bankruptcy—ensuring deterministic outcomes via seeded randomness and strict turn enforcement.",
        "Built a modular AI decision orchestration layer that constrains LLMs to valid actions only, validates structured tool-call responses, retries invalid outputs once, and applies deterministic fallback actions to guarantee uninterrupted and reproducible gameplay.",
        "Developed a comprehensive telemetry and logging system that records every game event, decision request, model response, applied action, and state snapshot, enabling full replay, auditability, and deep post-hoc analysis of model behavior.",
        "Engineered a real-time FastAPI backend with WebSocket streaming to manage game lifecycles (start, pause, resume, stop) and broadcast events and snapshots live to a React-based frontend without desynchronization or state leakage.",
        "Created an interactive frontend UI that visualizes the Monopoly board, player states, auctions, trades, and event feed, while providing detailed inspection tools to view exact LLM prompts, tool schemas, responses, retries, and fallback reasons.",
        "Implemented robust verification pipelines to prevent silent failures, including contract schema validation, deterministic replay checks, non-overwriting run artifacts, and test suites that enforce correctness invariants such as turn order integrity.",
        "Refactored and hardened the codebase to enforce clear architectural boundaries between the game engine, AI arena, API server, telemetry layer, and frontend, making the system extensible, debuggable, and suitable as a long-term research platform.",
        "Designed the system with benchmarking and research in mind, enabling controlled experiments on long-horizon planning, negotiation dynamics, tool-use reliability, auction behavior, and multi-agent strategic reasoning across different LLMs."
      ],
      "tags": [
        "Python",
        "TypeScript",
        "FastAPI",
        "React",
        "WebSockets",
        "LLMs",
        "Multi-Agent Systems",
        "AI Benchmarking",
        "Game Simulation",
        "Deterministic Systems",
        "OpenRouter",
        "Prompt Engineering",
        "System Design",
        "Research Infrastructure"
      ],
      "githubLink": "https://github.com/KushagraBharti/monopoly-llm-benchmark",
      "thumbnail": "/portfolio/projects/monopoly-llm-benchmark.svg"
    },
    {
      "slug": "pact",
      "order": 2,
      "title": "Pact",
      "summary": "A social accountability app where users create goal-based pacts, lock funds in escrow, submit proof, and let a trusted circle of validators decide the outcome.",
      "description": [
        "Built a full-stack accountability product that turns vague self-improvement goals into credible commitments by combining financial stakes, private social pressure, and validator-based resolution.",
        "Developed the complete pact lifecycle end to end: users create circles, invite trusted members, define goal-based commitments, lock funds, submit photo proof, and receive approval or rejection through majority validator voting.",
        "Implemented a typed backend with authenticated API routes, server-side authorization, and lifecycle enforcement so protected actions never trust client-supplied user identity or pact state.",
        "Integrated Supabase Auth, Postgres, and Storage to support user accounts, circle membership, invite flows, commitment records, validator votes, and proof-image uploads in a single durable system.",
        "Engineered escrow mechanics on Solana for real stake locking and release flows, while also supporting robust demo and development workflows for testing end-to-end commitment enforcement.",
        "Designed Pact as both a mobile and web experience with a dark, high-signal interface focused on commitment status, proof submission, validator transparency, and financial accountability.",
        "Built safety and trust constraints directly into the product logic, including validator membership checks, creator exclusion from self-voting, server-verified access control, and majority-based resolution rules.",
        "Shipped the project as a working hackathon product that won 1st place in the Solana track at HackSMU, demonstrating a credible consumer fintech concept backed by a real full-stack and on-chain implementation."
      ],
      "tags": [
        "TypeScript",
        "React Native",
        "Expo",
        "Expo Router",
        "Fastify",
        "Supabase",
        "PostgreSQL",
        "Solana",
        "Web3",
        "SPL Token",
        "Mobile Development",
        "Full-Stack Development",
        "Fintech",
        "Consumer Social",
        "System Design",
        "Hackathon"
      ],
      "githubLink": "https://github.com/KushagraBharti/resolve",
      "thumbnail": "/portfolio/projects/pact.png"
    },
    {
      "slug": "arachne-web-crawler",
      "order": 3,
      "title": "Arachne Web Crawler",
      "summary": "A result-first Go web crawler with a Next.js reading interface, Brave Search seed selection, asynchronous top-10 result prefetching, live crawl streaming, rooted discovery trees, and local JSON artifacts for inspection and debugging.",
      "description": [
        "Built a full-stack web crawler designed around usable results rather than telemetry: users can enter a URL or keyword, choose the exact seed page, read extracted article text, inspect discovered pages, and verify every run through local JSON artifacts.",
        "Implemented a concurrent Go crawler engine with bounded global concurrency, per-host concurrency, request/header/TLS/idle timeouts, max body limits, retry handling, redirect handling, robots.txt support, canonical URL deduplication, max-depth limits, max-page limits, and time-budget enforcement.",
        "Designed keyword search as a fast seed-selection workflow: the backend calls the Brave Search API, keeps the top 10 results, returns those choices to the frontend immediately, and asynchronously prefetches the candidate pages in the background while the user is deciding.",
        "Optimized perceived startup latency by reusing prefetched candidate pages as crawl roots: when a user clicks `Start here` on a result such as PBS, the selected page can be emitted immediately as depth 0 and the crawler can begin expanding from its outgoing links without waiting for a duplicate first fetch.",
        "Modeled crawl output as a rooted page-discovery tree rather than a general web graph, where the selected seed is always depth 0 and every edge records that a child page was discovered from a specific parent page's links.",
        "Built a live Next.js App Router frontend with an editorial dark UI, page index, article reading surface, graph tab, diagnostics footer, SSE updates, and polling fallback so newly fetched pages stream into the interface while the crawl is running.",
        "Persisted every run into inspectable JSON artifacts under `data/runs/<run-id>/`, including `run.json`, `pages.json`, `tree.json`, and `diagnostics.json`, making the crawler debuggable from both the browser and the terminal.",
        "Added detailed diagnostics for search attempts, selected seeds, candidate prefetch completion/failure, skipped URLs, retries, fetch completions, HTTP status failures, artifact paths, and crawl stop reasons.",
        "Benchmarked the synthetic local crawler path using an `httptest` workload of 501 pages (1 root + 500 linked pages), measuring 1.5089s per iteration on an Intel i7-13700HX, or roughly 332 pages/sec in a controlled no-external-network setup.",
        "Verified the project with backend and frontend checks: `go test ./...` passes across crawler, artifact, search, and utility packages, and `bun run build` passes for the Next.js frontend."
      ],
      "tags": [
        "Go",
        "TypeScript",
        "Next.js",
        "React",
        "Web Crawling",
        "Concurrent Systems",
        "Brave Search API",
        "Server-Sent Events",
        "Robots.txt",
        "URL Canonicalization",
        "Deduplication",
        "JSON Artifacts",
        "Performance Benchmarking",
        "System Design",
        "Full-Stack Development"
      ],
      "githubLink": "https://github.com/KushagraBharti/Web-Crawler-Go",
      "thumbnail": "/portfolio/projects/arachne-web-crawler.svg"
    },
    {
      "slug": "autohdr-ml-lens-correction",
      "order": 4,
      "title": "AutoHDR ML Lens Correction",
      "summary": "Built a competition-grade automatic lens-correction pipeline that combines a CNN with analytic camera geometry (Brown–Conrady) for stable, reproducible distortion correction at full resolution.",
      "description": [
        "Built a geometry-first lens-correction system designed for leaderboard-safe, reproducible submissions: predict warp parameters (and optional residual flow), apply a single full-resolution backward warp, validate via proxy/QA gates, and package deterministic submissions.",
        "Model architecture: HybridLensCorrectionModel with a ResNet34 backbone and two heads — (1) an MLP predicting Brown–Conrady lens coefficients (k1,k2,k3,p1,p2,dcx,dcy,scale) and (2) a conv decoder predicting a 2-channel residual displacement field for local corrections.",
        "Training approach: staged training (param-only → hybrid → finetune) to progressively introduce the residual path while maintaining stability; cloud training ran on NVIDIA H200.",
        "Verified quality progression across stages (cloud): proxy_fullres_slice_total_score improved from 0.8851 (stage1) to 0.8942 (stage3), with validation loss reduced 15.66% (0.09398 → 0.07927).",
        "Stability hardening: training warnings dropped from 64 in stage1 to 0 in stage2/stage3 (including non-finite warnings 16 → 0).",
        "Data scale handled: 23,118 training pairs (46,238 files; 83 lens models; 99 camera models; 5,575 photoshoots) plus a 1,000-image test set.",
        "Benchmarking + sizing: fused hybrid warp p50 latency measured at 2.20ms (128×192) and 15.47ms (512×768) with 7.04× scaling; full predictor p50/p95 latency measured at 295.98ms/322.40ms on a 1367×2048 image.",
        "End-to-end inference: processed 1,000 cloud test images in hybrid mode with 0 unsafe triggers/fallbacks recorded in the stage3 handoff metadata.",
        "Competition outcome: the solution led to a follow-up call with AutoHDR’s founder and CTO to walk through the system design and discuss potential internship/job opportunities.",
        "Engineering rigor: 108/108 tests passing (18 files) covering geometry contracts, inference fallback behavior, training hooks, QA tooling, and submission flows; submission zips are deterministic (bit-identical SHA-256 across rebuilds)."
      ],
      "tags": [
        "Computer Vision",
        "Deep Learning",
        "PyTorch",
        "CNNs",
        "ResNet34",
        "Image Geometry",
        "Lens Distortion Correction",
        "Brown–Conrady Model",
        "Optical Flow",
        "Warping / grid_sample",
        "Model Training",
        "Staged Training",
        "Benchmarking",
        "Reproducible Systems",
        "Testing",
        "QA Tooling",
        "Competition Engineering"
      ],
      "githubLink": "https://github.com/satvikh/autohdr-lenscorrection",
      "thumbnail": "/portfolio/projects/autohdr-ml-lens-correction.png"
    },
    {
      "slug": "novelbench",
      "order": 5,
      "title": "NovelBench",
      "summary": "A live multi-stage LLM benchmark and public arena where frontier models generate, critique, revise, and vote on the same creative prompts to evaluate innovation under pressure.",
      "description": [
        "Built a fully solo benchmarking platform that evaluates whether large language models can actually innovate by competing through a structured creative process rather than a single one-shot response.",
        "Designed and implemented a durable multi-stage workflow where 2–8 frontier models generate ideas, critique each other anonymously, revise using aggregated feedback, and participate in final voting to determine comparative performance.",
        "Engineered the system around replayable runs, append-only events, live traces, and persisted artifacts so every benchmark can be audited, inspected, and revisited instead of disappearing after execution.",
        "Built a Convex-backed backend architecture for run orchestration, durable state management, read models, leaderboard snapshots, archive surfaces, usage tracking, and concurrency control across active benchmark executions.",
        "Integrated OpenRouter-based model execution and optional research tooling while handling unreliable model behavior through structured output normalization, scoring logic, failure tolerance, and stage-level workflow resilience.",
        "Developed anonymous critique and voting systems to reduce model bias and produce more meaningful comparative rankings, making fairness and evaluation quality a core part of the product rather than an afterthought.",
        "Created a polished Next.js product surface with a public landing page, live arena, searchable archive, leaderboard views, and detailed run pages that expose the full benchmark process to users and spectators.",
        "Launched the platform live with real usage, producing 47 benchmark runs and 194 generated ideas so far, and positioned it as the foundation for a broader AI startup platform focused on ideation, planning, iteration, and execution."
      ],
      "tags": [
        "TypeScript",
        "Next.js",
        "React",
        "Convex",
        "OpenRouter",
        "LLMs",
        "AI Benchmarking",
        "Workflow Orchestration",
        "Realtime Systems",
        "System Design",
        "Evaluation Infrastructure",
        "Prompt Engineering",
        "Product Engineering",
        "Research Infrastructure",
        "Startup Tools",
        "Solo Project"
      ],
      "githubLink": "https://github.com/KushagraBharti/NovelBench",
      "thumbnail": "/portfolio/projects/novel-bench.png"
    },
    {
      "slug": "pseudo-lawyer",
      "order": 6,
      "title": "PseudoLawyer",
      "summary": "An AI-powered real-time contract negotiation platform that uses a virtual mediator to resolve disputes and draft bespoke legal agreements.",
      "description": [
        "Architected a real-time, multi-party negotiation platform using Next.js 15 and Supabase Realtime, enabling synchronized group chats between opposing parties.",
        "Engineered 'Sudo', an autonomous AI mediator powered by Anthropic's Claude 3.5 Sonnet, capable of understanding context, proposing compromises, and neutralizing heated debates in real-time.",
        "Implemented a smart 'Ask Sudo' triggering system that allows the AI to passively monitor the conversation and intervene only when explicitly invoked or needed.",
        "Built a contract generation engine that synthesizes the entire negotiation history into a professional, legally-structured document using LLM-driven drafting.",
        "Designed a premium, 'Glassmorphism' UI with Tailwind CSS and Framer Motion, featuring dark mode, typing indicators, and seamless role-based access control."
      ],
      "tags": [
        "Next.js 15",
        "TypeScript",
        "Supabase",
        "Realtime",
        "PostgreSQL",
        "OpenRouter",
        "Anthropic Claude 3.5",
        "Tailwind CSS",
        "Framer Motion",
        "Legal Tech",
        "AI Agents"
      ],
      "githubLink": "https://github.com/KushagraBharti/PseudoLawyer",
      "thumbnail": "/portfolio/projects/pseudo-lawyer.png"
    },
    {
      "slug": "personal-site",
      "order": 7,
      "title": "Personal Portfolio Website",
      "summary": "A dynamic full-stack portfolio website with a public showcase, a private personal tracker, live GitHub and weather widgets, and machine-readable content for both humans and models.",
      "description": [
        "Built a polished public portfolio with a hero section, featured projects, about content, education, experience, and a dedicated `/ai` view that presents the site in a structured, machine-readable format.",
        "Added a private tracker surface alongside the public site so personal workflows live behind a separate authenticated product area without leaking into the portfolio experience.",
        "Centralized the site content in backend modules and generated `llms.txt` from the same source of truth, keeping the public copy, project cards, and AI-facing snapshot aligned.",
        "Integrated live GitHub and weather widgets with backend caching and graceful fallback behavior so the homepage stays dynamic without depending on fragile client-side lookups.",
        "Shipped the interface as a responsive, motion-forward React app with Express APIs, Tailwind styling, Vite builds, and a verification suite that covers unit, integration, smoke, E2E, and live flows."
      ],
      "tags": [
        "TypeScript",
        "Node.js",
        "Express",
        "React",
        "Vite",
        "Tailwind CSS",
        "Framer Motion",
        "Bun",
        "Vitest",
        "Playwright",
        "REST API",
        "Full-Stack Development",
        "API Integration",
        "Live Widgets",
        "System Design",
        "Testing"
      ],
      "githubLink": "https://github.com/KushagraBharti/Personal-Site",
      "thumbnail": "/portfolio/projects/personal-site.svg"
    },
    {
      "slug": "f1-optimization",
      "order": 8,
      "title": "F1 Optimization Project",
      "summary": "A simulation-based F1 race optimization project using reinforcement learning. Built for HackTX-2024, it integrates a custom Pygame-based race environment with a SAC agent from Ray RLlib to optimize driving strategies on a realistic race track.",
      "description": [
        "Developed a custom Gymnasium environment ('Race') that simulates an F1 track using Pygame and OpenCV for track extraction.",
        "Implemented a Car class with sensor-based perception (echo sensors) to inform both heuristic and RL-based control strategies.",
        "Integrated Ray Tune and RLlib's SACTrainer for training an RL agent, with functionality to restore from checkpoints and export training artifacts.",
        "Provided both manual control mode (via keyboard input) and an echo-heuristic agent for testing and debugging.",
        "Although the codebase contains extra legacy and experimental code snippets, the core functionality demonstrates effective application of RL in a simulated racing context."
      ],
      "tags": [
        "Reinforcement Learning",
        "Ray RLlib",
        "Pygame",
        "OpenCV",
        "Simulation",
        "F1",
        "Optimization",
        "HackTX 2024",
        "Gymnasium"
      ],
      "githubLink": "https://github.com/KushagraBharti/HackTX-2024---F1-Optimization",
      "thumbnail": "/portfolio/projects/f1-optimization.svg"
    },
    {
      "slug": "kaggle-titanic-ml",
      "order": 9,
      "title": "Kaggle Titanic ML",
      "summary": "Predicted Titanic survival using machine learning. This project involved extensive data cleaning, feature engineering, and model evaluation using various algorithms, with a comprehensive PDF outlining all my learnings.",
      "description": [
        "Acquired the Titanic dataset from Kaggle and performed detailed data cleaning with Pandas—handling missing values, extracting titles from names, and engineering new features such as FamilySize and IsAlone.",
        "Conducted exploratory data analysis (EDA) using Seaborn and Matplotlib to reveal key insights about passenger demographics and survival correlations.",
        "Built and evaluated multiple models (Logistic Regression, SVM, KNN, Decision Tree, Random Forest, Naive Bayes, Perceptron, and SGD) with scikit-learn, achieving the best training accuracy (~86.76%) with Decision Tree and Random Forest models.",
        "Included a comprehensive PDF report that critically documents all the steps, challenges, and learnings throughout the project."
      ],
      "tags": [
        "Machine Learning",
        "Kaggle",
        "Titanic",
        "Data Analysis",
        "Python",
        "Pandas",
        "scikit-learn",
        "EDA",
        "Feature Engineering",
        "Random Forest"
      ],
      "githubLink": "https://github.com/KushagraBharti/Kaggle-Titanic-Solution",
      "thumbnail": "/portfolio/projects/kaggle-titanic-ml.svg"
    },
    {
      "slug": "quant-test-environment",
      "order": 10,
      "title": "Algorithmic Trading Quantitative Test Environment",
      "summary": "A modular platform for automated trading strategy development, backtesting, and paper trading.",
      "description": [
        "Fetched 1-year historical AAPL data (2022–2023) via the Alpaca API, saving both raw and processed datasets for reproducibility.",
        "Engineered advanced features like rolling moving averages and returns to drive a dynamic 20/50-day Moving Average Crossover strategy.",
        "Performed rigorous backtesting with transaction cost modeling to compute key performance metrics (Sharpe Ratio, Max Drawdown, Final Return) and generate detailed trade logs.",
        "Integrated with Alpaca's paper trading system to simulate real-time order placement, monitor execution, and validate strategy performance.",
        "Developed visualization tools for plotting equity curves and annotating buy/sell signals, enhancing the interpretability of trading insights."
      ],
      "tags": [
        "Python",
        "Alpaca API",
        "Pandas",
        "NumPy",
        "Matplotlib",
        "scikit-learn",
        "Algorithmic Trading",
        "Backtesting",
        "Paper Trading"
      ],
      "githubLink": "https://github.com/KushagraBharti/Quant-Test-Environment",
      "thumbnail": "/portfolio/projects/quant-test-environment.svg"
    },
    {
      "slug": "northstar-agentic-financial-memory",
      "order": 11,
      "title": "Northstar Agentic Financial Memory Platform",
      "summary": "A memory-first AI wealth-management prototype where one local agent, North, loads a user's durable financial context, portfolio snapshot, and tool traces to deliver explainable market checks, scenario analysis, and approval-first financial guidance.",
      "description": [
        "Built an agentic FinTech platform around durable user context rather than a static portfolio dashboard: onboarding answers compile into a readable `memory.md`, a structured `context_packet.json`, and a graph of goals, risk comfort, tax constraints, accounts, values, cash-flow assumptions, and communication preferences.",
        "Designed the core runtime around one visible local agent, North, which preloads memory, context packets, and portfolio snapshots before every response, then uses specialist tools for market/news research, financial data, filings, portfolio context, deterministic scenario checks, and trust-receipt generation.",
        "Implemented a chat-first React/Vite interface with a dedicated North page, bottom composer, markdown-rendered answers, quick actions for daily market checks and demo scenarios, a `memory.md` transparency modal, and a JSONL-style trace panel that exposes tool calls, tool results, memory loading, run completion, and receipt events.",
        "Engineered the onboarding flow as a high-signal natural-language memory compiler: a 44-question questionnaire is auto-filled from `docs/memory-questionnaire-sample.md`, persisted per user, and submitted to the backend to create structured goals, values, risk comfort, communication style, tax context, approval boundaries, and final memory artifacts.",
        "Created a graph-first dashboard where the default Home view visualizes durable user context as memory nodes instead of generic financial charts, making the product thesis concrete: the agent knows the person, not just the account balances.",
        "Added deterministic demo reliability for live presentations: simulated Plaid-style account import, seeded holdings/transactions/tax lots, market-check fallbacks, capped external search/research calls, and scenario traces that keep the product working even when API keys, live data providers, or LLM responses fail.",
        "Integrated an Express + TypeScript backend with Supabase/Postgres-ready persistence, OpenRouter/OpenAI-compatible model execution, shared domain types, memory/status APIs, raw memory endpoints, agent streaming routes, local JSON/JSONL mirrors, and production build/typecheck validation across shared, backend, and frontend workspaces.",
        "Focused the architecture on 2026 AI-system patterns—agentic workflows, contextual memory, tool use, observability, audit trails, human-in-the-loop guardrails, and grounded retrieval/context packets—rather than a simple chatbot wrapper, aligning the demo with where production AI applications are moving.",
        "Built the main demo scenario around a realistic financial stress test: North can answer questions such as `What if markets drop 20% and I need cash next year?` by combining memory, liquidity needs, portfolio context, risk tolerance, tax awareness, tool traces, and approval-first recommendations.",
        "Documented the full project plan and demo story in `docs/complete.md`, including the eight-slide narrative, system architecture, trust model, onboarding/memory pipeline, North runtime, deterministic scenario path, remaining product gaps, and final pitch positioning."
      ],
      "tags": [
        "TypeScript",
        "React",
        "Vite",
        "Express",
        "Supabase",
        "PostgreSQL",
        "OpenRouter",
        "LLMs",
        "Agentic AI",
        "AI Agents",
        "Tool Calling",
        "Contextual Memory",
        "RAG",
        "JSONL Tracing",
        "Observability",
        "Guardrails",
        "FinTech",
        "Portfolio Analytics",
        "Scenario Analysis",
        "Full-Stack Development",
        "System Design"
      ],
      "githubLink": "https://github.com/YuvrajKashyap/northstar",
      "thumbnail": "/portfolio/projects/northstar-agentic-financial-memory.svg"
    },
    {
      "slug": "age-gender-recognition",
      "order": 12,
      "title": "Age & Gender Recognition",
      "summary": "Real-time face detection with age and gender prediction using OpenCV and Caffe models.",
      "description": [
        "Developed a real-time system that leverages OpenCV’s dnn module to detect faces in live video streams and dynamically annotate them.",
        "Utilized pre-trained Caffe models for age and gender classification, achieving approximately 71% accuracy for gender and 62% for age predictions.",
        "Optimized detection by fine-tuning confidence thresholds and applying padding to accurately extract facial regions.",
        "Integrated a robust pipeline that draws bounding boxes and overlays prediction labels on faces for intuitive visual feedback."
      ],
      "tags": [
        "Python",
        "OpenCV",
        "DNN",
        "Caffe",
        "Face Detection",
        "Real-Time Processing"
      ],
      "githubLink": "https://github.com/KushagraBharti/Gender-Age-Detection",
      "thumbnail": "/portfolio/projects/age-gender-recognition.svg"
    },
    {
      "slug": "data-drive",
      "order": 13,
      "title": "DataDrive: Unified Insights for Data & Fuel Optimization",
      "summary": "A full-stack AI-driven analytics platform that integrates advanced ML models, real-time data observability, and interactive visualizations for fuel optimization.",
      "description": [
        "Developed a modular Flask backend with multiple API endpoints for fuel efficiency prediction, car details retrieval, and clustering analysis using pre-trained Linear Regression and K-Means models.",
        "Implemented robust services including scheduled anomaly detection with APScheduler, SHAP-based interpretability, and comprehensive data observability with automated logging.",
        "Integrated advanced external services such as GPT-4 powered explanation generation for model outputs and Pinata for decentralized file storage, enhancing transparency and auditability.",
        "Engineered end-to-end training pipelines for both regression (evaluated via MAE and R² metrics) and clustering models (using PCA for visualization), ensuring actionable insights.",
        "Built a modern React dashboard featuring interactive D3.js charts, real-time fuel efficiency predictions, a 3D car model viewer via react-three-fiber, and dynamic cluster visualizations."
      ],
      "tags": [
        "Flask",
        "Python",
        "Machine Learning",
        "Linear Regression",
        "KMeans",
        "APScheduler",
        "SHAP",
        "OpenAI",
        "Pinata",
        "React",
        "D3.js",
        "Three.js",
        "Data Analytics"
      ],
      "githubLink": "https://github.com/KushagraBharti/HACKUTD-Data-Drive",
      "thumbnail": "/portfolio/projects/data-drive.svg"
    },
    {
      "slug": "circuit-seer",
      "order": 14,
      "title": "CircuitSeer (Circuit Solver)",
      "summary": "An AI-powered circuit analysis tool that automates the identification and schematic analysis of electronic circuits for both educational and practical use.",
      "description": [
        "Developed under the AI Mentorship Program at the University of Texas at Dallas, CircuitSeer automatically analyzes circuit diagrams by accurately detecting and classifying electronic components.",
        "Utilizes a fine-tuned YOLOv5 model for fast and precise object detection to identify components such as resistors, capacitors, and more within complex layouts.",
        "Integrates classical computer vision techniques—namely Canny Edge Detection and Hough Transform—to trace wiring and delineate circuit structures.",
        "Built using Python and Flask, it seamlessly bridges backend processing with a user-friendly web interface, allowing users to upload diagrams and receive detailed, step-by-step schematic insights.",
        "Designed to support students and professionals alike in understanding circuit design, troubleshooting, and exam preparation."
      ],
      "tags": [
        "Python",
        "YOLOv5",
        "Flask",
        "OpenCV",
        "Computer Vision",
        "Canny Edge Detection",
        "Hough Transform"
      ],
      "githubLink": "https://github.com/Hteam121/circuit-seer",
      "thumbnail": "/portfolio/projects/circuit-seer.svg"
    },
    {
      "slug": "point-cloud-down-sampler",
      "order": 15,
      "title": "Point Cloud Down Sampler",
      "summary": "A dual-approach tool for reducing dense point clouds via custom voxelization and Open3D’s high-performance voxel grid method.",
      "description": [
        "Developed a custom algorithm that groups 3D points into discrete voxels using mathematical flooring, significantly reducing dataset size while preserving shape integrity.",
        "Leveraged Open3D’s built-in voxel_down_sample() for rapid, efficient downsampling and interactive 3D visualization, showcasing superior performance and ease-of-use.",
        "Engineered a complete pipeline that converts CSV point cloud data into PCD format, applies both methods, and exports downsampled outputs for further analysis.",
        "Demonstrated versatility by comparing a from-scratch implementation with a state-of-the-art library approach to optimize for both accuracy and processing speed."
      ],
      "tags": [
        "Python",
        "Pandas",
        "Open3D",
        "Voxelization",
        "Point Cloud",
        "Downsampling",
        "Math Modeling"
      ],
      "githubLink": "https://github.com/KushagraBharti/PointCloud-DownSampler",
      "thumbnail": "/portfolio/projects/point-cloud-down-sampler.svg"
    },
    {
      "slug": "pcb-design-project",
      "order": 16,
      "title": "PCB Design Project",
      "summary": "A Senior Independent Project in 2023 that provided hands-on experience in designing, ordering, and assembling custom PCBs.",
      "description": [
        "Designed and ordered multiple PCBs using EasyEDA, experiencing the entire workflow from schematic capture to layout and manufacturing.",
        "Sourced and selected electrical components from integrated platforms like LCSC and JLCPCB, balancing cost, availability, and performance.",
        "Developed a deep understanding of key PCB parameters, including size, thermal management, component placement, power and signal integrity, and manufacturing constraints.",
        "Addressed design challenges such as handling multiple ATmega328 variants, integrating both SMD and THT components, and implementing capacitive touch buttons.",
        "Gained practical soldering and testing skills, ensuring reliable assembly and real-world functionality."
      ],
      "tags": [
        "PCB Design",
        "Circuit Design",
        "EasyEDA",
        "JLCPCB",
        "Electronics",
        "Hardware",
        "Soldering"
      ],
      "githubLink": "https://github.com/KushagraBharti/PCB-Design-Project",
      "thumbnail": "/portfolio/projects/pcb-design-project.svg"
    },
    {
      "slug": "self-driving-car-project",
      "order": 17,
      "title": "Self-Driving Car Project",
      "summary": "Repurposed an RC car into a self-driving vehicle using Arduino hardware and a custom obstacle avoidance algorithm.",
      "description": [
        "Tore apart an RC car, rebuilt its interior with an Arduino Uno and motor shield, and rewired all components (including integrating ultrasonic sensors and new soldering) for improved functionality.",
        "Developed C++ code that reads ultrasonic sensor data to implement an obstacle detection and avoidance algorithm, enabling autonomous navigation through complex environments."
      ],
      "tags": [
        "Arduino",
        "C++",
        "Self-Driving",
        "Autonomous Vehicle",
        "RC Car",
        "Electronics",
        "Ultrasonic Sensors",
        "Hardware"
      ],
      "thumbnail": "/portfolio/projects/self-driving-car-project.svg"
    },
    {
      "slug": "maze-traversal",
      "order": 18,
      "title": "Maze Traversal",
      "summary": "A recursive depth-first search maze-solving algorithm in Python.",
      "description": [
        "Implemented a Maze_Crawler class that solves a maze represented as a nested list using recursion and DFS.",
        "The algorithm marks the solution path with directional arrows (v, ^, >, <) to visually trace the route from the start ('S') to the exit ('E').",
        "Includes functionality to load maze configurations from a text file, identify the starting point, and print intermediate maze states for real-time progress tracking.",
        "Measures execution time to evaluate performance, offering a concise and efficient educational tool for understanding recursive algorithms."
      ],
      "tags": [
        "Python",
        "Depth-First Search",
        "Recursion",
        "Maze Solving"
      ],
      "thumbnail": "/portfolio/projects/maze-traversal.svg"
    }
  ],
  "media": [
    {
      "slug": "st-stephens-dining-hall-documentary",
      "order": 1,
      "title": "St. Stephen's Dining Hall Documentary",
      "subtitle": "2022",
      "embedUrl": "https://www.youtube.com/embed/WM6RvRfDCX4",
      "type": "video"
    },
    {
      "slug": "the-pbj-documentary",
      "order": 2,
      "title": "The PB&J Documentary",
      "subtitle": "2023",
      "embedUrl": "https://www.youtube.com/embed/FS8l8G2p7PM",
      "type": "video"
    }
  ],
  "ai": {
    "providers": [
      {
        "slug": "chatgpt",
        "order": 1,
        "label": "ChatGPT",
        "icon": "openai",
        "hoverColorClass": "hover:text-[#10a37f]",
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.",
        "action": {
          "type": "link",
          "hrefTemplate": "https://chat.openai.com/?q={{query}}"
        }
      },
      {
        "slug": "claude",
        "order": 2,
        "label": "Claude",
        "icon": "claude",
        "hoverColorClass": "hover:text-[#da7756]",
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.",
        "action": {
          "type": "link",
          "hrefTemplate": "https://claude.ai/new?q={{query}}"
        }
      },
      {
        "slug": "gemini",
        "order": 3,
        "label": "Gemini",
        "icon": "gemini",
        "hoverColorClass": "hover:text-[#4285f4]",
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.\n\nBE EXTREMEMELY THOROUGH AND DETAILED. WRITE A LOT. MUCH MORE.\n\nWrite a thorough, structured profile with these sections:\n\n1) One-sentence positioning\n2) Professional experience and research\n3) Strongest technical projects\n4) Engineering style and recurring themes\n5) Creative work and non-technical interests\n6) Overall trajectory\n\nUse concrete names, roles, projects, tools, metrics, and outcomes from the pages you read. If you cannot access one of the pages, say exactly which one failed, then use the other accessible portfolio sources and links to produce the best possible summary anyway.",
        "action": {
          "type": "clipboard",
          "message": "Gemini does not support pre-filled prompt links reliably, so the prompt has been copied to your clipboard."
        }
      },
      {
        "slug": "grok",
        "order": 4,
        "label": "Grok",
        "icon": "x",
        "hoverColorClass": "hover:text-[#111111]",
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.",
        "action": {
          "type": "link",
          "hrefTemplate": "https://grok.com/?q={{query}}"
        }
      }
    ]
  }
};
