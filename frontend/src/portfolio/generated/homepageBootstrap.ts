export type HomePageBootstrap = {
  about: {
    introHeading: string;
    introBody: string;
  };
  writings: Array<{
    slug: string;
    title: string;
    summary: string;
  }>;
  experiences: Array<{
    slug: string;
    dateRange: string;
    category: string;
    position: string;
    summary: string;
    timelineTone: "active" | "past";
  }>;
  projects: Array<{
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    thumbnail?: string;
    githubLink?: string;
  }>;
  profile: {
    socialLinks: Array<{
      label: string;
      href: string;
    }>;
  };
};

export const homepageBootstrap: HomePageBootstrap = {
  "about": {
    "introHeading": "Hey there! I'm Kushagra Bharti",
    "introBody": "I am a student and software builder who enjoys learning and expanding my skillset."
  },
  "writings": [
    {
      "slug": "epistemic-velocity",
      "title": "epistemic velocity",
      "summary": "Lifelong learning as epistemic hygiene: curiosity, discipline, and pressure against stale competence."
    },
    {
      "slug": "adaptive-agency",
      "title": "adaptive agency",
      "summary": "High-agency adaptation under ambiguity: fast revision, clear authorship, tools kept subordinate."
    },
    {
      "slug": "aesthetic-judgment",
      "title": "aesthetic judgment",
      "summary": "Taste as compressed perception: rhythm, restraint, framing, and selection when generation is cheap."
    },
    {
      "slug": "ambient-agency",
      "title": "ambient agency",
      "summary": "Software as ambient infrastructure: fewer destinations, stronger memory, cleaner preservation of intent."
    }
  ],
  "experiences": [
    {
      "slug": "utsw-tsai-lab-machine-learning-engineering-intern",
      "dateRange": "Feb 2026 - Present",
      "category": "Research",
      "position": "Machine Learning Engineer Intern at UT Southwestern Medical Center, Tsai Lab",
      "summary": "Fine-tuning DeepLabCut/SuperAnimal for lab-specific 3-chamber mouse-behavior video and building an end-to-end computer vision pipeline for pose extraction, behavioral scoring, QC, and researcher-facing scorecards.",
      "timelineTone": "active"
    },
    {
      "slug": "ut-dallas-undergraduate-researcher-monopolybench",
      "dateRange": "Apr 2025 - Present",
      "category": "Research",
      "position": "Undergraduate Researcher at UT Dallas, CAIR Lab",
      "summary": "Built MonopolyBench, a deterministic multi-agent LLM benchmark for evaluating tool-calling agents on long-horizon planning, negotiation, deception, bias, memory, and schema-constrained decision-making.",
      "timelineTone": "active"
    },
    {
      "slug": "glydr-software-engineer",
      "dateRange": "Jan 2026 - May 2026",
      "category": "Industry",
      "position": "Software Engineer at Glydr.gg",
      "summary": "Led engineering for Glydr.gg's Railway-deployed, microservice-based configuration platform serving 1,000+ users, spanning public discovery, Steam authentication, admin tooling, Control Panel imports, CI/CD, and distributed config delivery.",
      "timelineTone": "past"
    },
    {
      "slug": "ut-dallas-undergraduate-researcher-optimization",
      "dateRange": "Apr 2025 - Nov 2025",
      "category": "Research",
      "position": "Independent Researcher (Optimization + ML) at UT Dallas",
      "summary": "Built paper-faithful optimization solvers and a solver-labeled dataset pipeline for 1D drone coverage planning, with benchmarks and QC gates to support supervised, GNN, and RL experiments on optimal tour planning.",
      "timelineTone": "past"
    },
    {
      "slug": "abilitie-software-engineering-intern",
      "dateRange": "May 2024 - Aug 2024",
      "category": "Industry",
      "position": "Software Engineering Intern at Abilitie",
      "summary": "Owned Llama 3.1 fine-tuning, structured-output engineering, cost optimization, telemetry, and latency work for Abilitie AI Cases, reducing LLM cost per conversation 70% across 27 role-play configurations and reaching 1.0s p95 TTFT.",
      "timelineTone": "past"
    },
    {
      "slug": "st-stephens-dorm-proctor",
      "dateRange": "Aug 2021 - May 2022",
      "category": "Leadership",
      "position": "Dorm Proctor at St. Stephen's Episcopal School",
      "summary": "Supported younger boarding students through peer mentorship, safety training, and community-building in a residential school environment.",
      "timelineTone": "past"
    }
  ],
  "projects": [
    {
      "slug": "monopolybench",
      "title": "MonopolyBench",
      "summary": "A deterministic long-horizon LLM-agent benchmark for evaluating planning, negotiation, deception, memory, bias, and asset-management behavior.",
      "tags": [
        "LLM Evaluation",
        "Agent Harness"
      ],
      "thumbnail": "/portfolio/projects/monopoly-llm-benchmark.svg",
      "githubLink": "https://github.com/KushagraBharti/MonopolyBench"
    },
    {
      "slug": "f1-reinforcement-learning",
      "title": "F1 Reinforcement Learning",
      "summary": "A custom Monza RL/simulation lab with F1 telemetry-calibrated V2 physics, CUDA evolutionary search, BC/SAC learned-policy training, and a 78.683s normal-start learned lap.",
      "tags": [
        "Reinforcement Learning",
        "Physics Simulation"
      ],
      "thumbnail": "/portfolio/projects/f1-optimization.png",
      "githubLink": "https://github.com/KushagraBharti/F1-ReinforcementLearning"
    },
    {
      "slug": "imc-prosperity-4",
      "title": "IMC Prosperity 4 Quant Trading Competition",
      "summary": "A top-6%-worldwide IMC Prosperity 4 trading system spanning fair-value market making, options pricing, residual signals, DP oracles, and replay diagnostics.",
      "tags": [
        "Quantitative Trading",
        "Backtesting"
      ],
      "thumbnail": "/portfolio/projects/imc-prosperity.png",
      "githubLink": "https://github.com/KushagraBharti/IMC-Prosperity-4"
    },
    {
      "slug": "pact",
      "title": "Pact",
      "summary": "A hackathon winner mobile accountability app where users turn goals into escrow-backed commitments, submit proof, and rely on trusted validators.",
      "tags": [
        "React Native",
        "Full-Stack Mobile"
      ],
      "thumbnail": "/portfolio/projects/pact.png",
      "githubLink": "https://github.com/KushagraBharti/Pact"
    },
    {
      "slug": "arachne-web-crawler",
      "title": "Go Web Crawler",
      "summary": "A high-concurrency Go web crawler with worker pools, host-aware frontier scheduling, PostgreSQL persistence, and 100,000-page public-web crawl runs.",
      "tags": [
        "Go Concurrency",
        "Goroutines"
      ],
      "thumbnail": "/portfolio/projects/arachne.png",
      "githubLink": "https://github.com/KushagraBharti/Web-Crawler-Go"
    },
    {
      "slug": "novelbench",
      "title": "NovelBench",
      "summary": "A live multi-stage LLM benchmark where frontier models generate, critique, revise, and vote on creative prompts under pressure.",
      "tags": [
        "LLM Evaluation",
        "Evaluation Infrastructure"
      ],
      "thumbnail": "/portfolio/projects/novel-bench.png",
      "githubLink": "https://github.com/KushagraBharti/NovelBench"
    },
    {
      "slug": "autohdr-ml-lens-correction",
      "title": "AutoHDR ML Lens Correction",
      "summary": "A geometry-first computer vision system for automatic lens correction, combining a staged ResNet34 hybrid CNN with Brown-Conrady camera geometry.",
      "tags": [
        "Computer Vision",
        "ResNet34 CNN"
      ],
      "thumbnail": "/portfolio/projects/autohdr-ml-lens-correction.png",
      "githubLink": "https://github.com/KushagraBharti/AutoHDR-LensCorrection"
    },
    {
      "slug": "beyond-chat",
      "title": "Beyond Chat",
      "summary": "An artifact-first AI workspace with specialized studios, tool-calling runs, durable context, model comparison, and storage-backed outputs.",
      "tags": [
        "RAG",
        "Artifact Systems"
      ],
      "thumbnail": "/portfolio/projects/beyond-chat.png",
      "githubLink": "https://github.com/KushagraBharti/Beyond-Chat"
    },
    {
      "slug": "kaggle-titanic-ml",
      "title": "Kaggle Titanic ML",
      "summary": "A complete Titanic ML pipeline covering data cleaning, feature engineering, model comparison, EDA, and a documented learning report.",
      "tags": [
        "Machine Learning",
        "Feature Engineering"
      ],
      "thumbnail": "/portfolio/projects/kaggle-titanic-ml.png",
      "githubLink": "https://github.com/KushagraBharti/Kaggle-Titanic-Solution"
    }
  ],
  "profile": {
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
    ]
  }
};
