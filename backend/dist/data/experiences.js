"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.experiencesData = void 0;
exports.experiencesData = [
    {
        position: "Undergraduate Researcher at UT Dallas (supervised by Prof. Ovidiu Daescu)",
        summary: "Building paper-faithful optimization solvers and a solver-labeled dataset pipeline for 1D drone coverage planning, with benchmarks + QC gates to support supervised learning, GNN, and RL experiments on optimal tour planning.",
        description: [
            "Implemented 4 paper-faithful solvers for 1D drone coverage planning (greedy + DP), including exact plan reconstruction (cost → tours) for solver-faithful labeling.",
            "Built an end-to-end data pipeline (instance generation → gold labels → featurization hooks → QC), enabling ML training on optimal solutions rather than heuristics.",
            "Measured labeling throughput on a verified run: 370 labeled instances in 2.71s (~136 samples/s), writing ~280KB (~759B/sample), with QC PASS validating constraints end-to-end.",
            "Configured dataset defaults targeting 67,000 labeled samples across splits (train/test/shifted/extrap/stress) for generalization + distribution-shift evaluation.",
            "Benchmarked solver performance and scaling: dp_full stays <1s up to n=1024 segments and reaches n=4096 in 8.41s, bounding exact-label generation cost for larger datasets.",
            "Maintained CI-ready correctness gates: 162 tests collected (152 pass in 1.15s), including 22 plan round-trip tests and 4 oracle cross-checks."
        ],
        tags: [
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
        companyLink: "https://personal.utdallas.edu/~daescu/"
    },
    {
        position: "Undergraduate Researcher at UT Dallas (mentored by PhD Candidate Parth Padalkar)",
        summary: "Built a deterministic, replayable Monopoly benchmark where LLMs play head-to-head via schema-typed tool calls, enabling research on long-horizon planning, negotiation/deception, and bias under fully logged, inspectable runs.",
        description: [
            "Built MonopolyBench: deterministic rules engine + LLM arena + telemetry + live UI, designed for reproducible benchmarking and dataset generation from full-game trajectories.",
            "Constrained LLM actions to schema-typed legal moves (19 action variants, 11 decision types; 31 event types) and enforced strict validation with exactly one corrective retry + deterministic fallback.",
            "Proved determinism and replayability: identical seeds reproduce identical canonical event traces (e.g., 454 events), and robust replay matches 20/20 runs when stepping to decision boundaries.",
            "Logged research-grade artifacts for inspection and analysis: 631/631 decisions have complete traces (prompt → tools → raw response → parsed action → applied events) with 100% prompt artifact completeness.",
            "Measured run footprint for scaling: ~1.25MB p50 and ~217 files/run across 20 runs (events/decisions/actions/state/prompts/summary), supporting large-scale batch evaluation.",
            "Defined research directions: win-rate ranking across models, long-horizon planning evaluation, negotiation/bluffing/deception via public vs private messages, and bias probing via controlled player descriptors; roadmap includes TrueSkill + micro-decision suites."
        ],
        tags: [
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
        companyLink: "https://github.com/KushagraBharti/MonopolyBench"
    },
    {
        position: "Consultant at Consult Your Community (Club)",
        summary: "Led data analytics to transform multi-source data into actionable insights.",
        description: [
            "Led data strategy for Made2Polish, architecting & deploying an end-to-end analytics solution (React, Flask, Python, Looker Studio) translating raw multi-source data (sales, inventory, social) into actionable business insights.",
            "Delivered strategic recommendations based on data analysis (e.g., content performance, customer segmentation, inventory forecasting), directly informing client decisions on retail expansion, production scaling, and competitive pricing.",
            "Engineered and presented a \"Data Source Strategy Map\" and interactive dashboards that centralized multi-platform KPIs, enabling the client to identify key revenue drivers and optimize marketing spend."
        ],
        tags: ["Data Analytics",
            "Python",
            "Flask",
            "Looker Studio"],
        companyLink: "https://www.utdcyc.com/"
    },
    {
        position: "Software Engineering Intern at Abilitie",
        summary: "Worked on a production role-play chatbot by benchmarking model choices, running prompt/model experiments, adding inference telemetry, and shipping performance + UI reliability improvements.",
        description: [
            "Reduced LLM cost per conversation by ~70% by supporting a production migration from GPT-4-32k → GPT-4o and further cutting prompt tokens per request by ~20% and retries by ~8% while maintaining role-play quality.",
            "Ran a structured optimization loop across 27 configurations (3 scenarios × 3 models × 3 system prompts), using a rubric + human review to improve instruction-following and reduce out-of-format outputs to ~5%; included prompt-injection testing and hardening iterations.",
            "Built a DynamoDB-backed telemetry pipeline (request + stream summary events) capturing TTFT/TTLT, tokens/sec, token counts, retries, error categories, provider/model metadata, and per-request tracing; used it to identify bottlenecks and drive ~10% latency improvement and ~95% completion success rate.",
            "Improved perceived responsiveness via a 3s idle prefetch path (send full prompt in the background; cancel/discard if the user continues typing) plus a 2-retry + timeout policy; reduced TTFT after Enter to p50/p95 ≈ 0.5s/1.5s without sacrificing streaming reliability.",
            "Extended inference plumbing to support experimentation with multiple model families (e.g., GPT-4/GPT-4o, Claude-class, Llama-class), standardizing request/response handling and logging to make comparisons apples-to-apples across providers/models.",
            "Implemented output-quality guardrails including a lightweight NSFW/vulgarity detection filter to enforce professional responses and reduce unsafe or unprofessional generations in customer-facing role-play flows.",
            "Processed and transformed ~1.6M chat turns into training-ready JSONL using custom Python scripts to support instruction-style fine-tuning workflows on AWS (SageMaker/Bedrock), improving response consistency for targeted role-play behaviors.",
            "Shipped product-facing UI/UX fixes in React + TypeScript + Material UI, including theme-aware rich-text paste sanitization (mapping Google Docs colors to theme palette tokens) to eliminate dark-mode invisibility and improve accessibility across internal admin tooling and AI Cases workflows."
        ],
        tags: ["LLMs",
            "Prompt Engineering",
            "Evaluation",
            "Telemetry",
            "DynamoDB",
            "AWS",
            "React",
            "TypeScript"],
        companyLink: "https://www.abilitie.com/"
    },
    {
        position: "Dorm Proctor at St. Stephen's Episcopal School",
        summary: "Guided and supported students in their transition to boarding school life.",
        description: [
            "Supported new students in their transition to boarding school, helping them adjust to routines and environment through active guidance and personalized support.",
            "Provided peer counseling on academics, personal issues, and social challenges, leveraging professional training from licensed counselors and therapists to ensure sensitive, effective support.",
            "Collaborated closely with dorm parents, administrators, and counselors to proactively maintain a safe, welcoming, and inclusive dorm environment, promoting a sense of belonging.",
            "Completed extensive safety training, including fire and emergency protocols, enabling preparedness for campus-wide safety and quick response in emergencies.",
            "Demonstrated strong time-management skills by balancing proctor responsibilities with academics, achieving a high standard of commitment to both roles.",
            "Went above and beyond to be a trusted resource for students, checking in regularly and addressing individual needs with empathy, fostering a positive and supportive community."
        ],
        tags: ["Mentorship",
            "Counseling",
            "Time Management",
            "Safety Training"],
        companyLink: "https://www.sstx.org/boarding/boarding-student-support"
    }
];
