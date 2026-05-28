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
      "summary": "Building computer vision tooling for behavioral neuroscience: a DeepLabCut/SuperAnimal pipeline that turns 3-chamber mouse videos into pose tracks, behavioral metrics, QC outputs, and CSV/XLSX scorecards for lab review.",
      "timelineTone": "active"
    },
    {
      "slug": "glydr-technical-lead-consultant",
      "dateRange": "Jan 2026 - Present",
      "category": "Product / Consulting",
      "position": "Software Engineer at Glydr.gg",
      "summary": "Leading technical/product direction for Glydr.gg’s customer-facing configuration hub: a Railway-deployed React/Vite + Fastify platform for discovering, importing, and managing foot-controller configs.",
      "timelineTone": "active"
    },
    {
      "slug": "ut-dallas-undergraduate-researcher-monopolybench",
      "dateRange": "Apr 2025 - Present",
      "category": "Research",
      "position": "Undergraduate Researcher at UT Dallas (LLM Evaluation)",
      "summary": "Built MonopolyBench, a deterministic multi-agent LLM harness where tool-calling agents play full Monopoly games, enabling research on long-horizon planning, negotiation, deception, and bias.",
      "timelineTone": "active"
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
      "summary": "Worked on Abilitie AI Cases, an LLM role-play training product, contributing to product flows, provider plumbing, structured outputs, telemetry, cost optimization, and perceived-latency improvements.",
      "timelineTone": "past"
    },
    {
      "slug": "st-stephens-dorm-proctor",
      "dateRange": "2021 - 2022",
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
      "summary": "A deterministic multi-agent LLM evaluation harness where tool-calling agents play full Monopoly games, enabling research on planning, negotiation, deception, and bias in long-running agent environments.",
      "tags": [
        "LLM Evaluation",
        "AI Agents"
      ],
      "thumbnail": "/portfolio/projects/monopoly-llm-benchmark.svg",
      "githubLink": "https://github.com/KushagraBharti/MonopolyBench"
    },
    {
      "slug": "pact",
      "title": "Pact",
      "summary": "A hackathon winner mobile accountability app where users turn goals into escrow-backed commitments, submit proof, and let trusted validators decide whether the commitment was kept.",
      "tags": [
        "TypeScript",
        "React Native"
      ],
      "thumbnail": "/portfolio/projects/pact.png",
      "githubLink": "https://github.com/KushagraBharti/Pact"
    },
    {
      "slug": "arachne-web-crawler",
      "title": "Arachne - Web Crawler",
      "summary": "A high-throughput Go web crawler with bounded concurrency, robots.txt handling, rooted discovery trees, live SSE updates, and local JSON artifacts for debugging runs.",
      "tags": [
        "Go",
        "TypeScript"
      ],
      "thumbnail": "/portfolio/projects/arachne.png",
      "githubLink": "https://github.com/KushagraBharti/Web-Crawler-Go"
    },
    {
      "slug": "autohdr-ml-lens-correction",
      "title": "AutoHDR ML Lens Correction",
      "summary": "A geometry-first computer vision system for automatic lens correction, using a staged ResNet34 hybrid CNN, Brown–Conrady camera geometry, and learned residual flow.",
      "tags": [
        "Computer Vision",
        "Deep Learning"
      ],
      "thumbnail": "/portfolio/projects/autohdr-ml-lens-correction.png",
      "githubLink": "https://github.com/KushagraBharti/AutoHDR-LensCorrection"
    },
    {
      "slug": "novelbench",
      "title": "NovelBench",
      "summary": "A live multi-stage LLM benchmark where frontier models generate, critique, revise, and vote on creative prompts to evaluate innovation under pressure.",
      "tags": [
        "TypeScript",
        "Next.js"
      ],
      "thumbnail": "/portfolio/projects/novel-bench.png",
      "githubLink": "https://github.com/KushagraBharti/NovelBench"
    },
    {
      "slug": "imc-prosperity-4",
      "title": "IMC Prosperity 4 Quant Trading Competition",
      "summary": "A top 6% worldwide IMC Prosperity 4 trading system built across five rounds of market making, options pricing, alpha research, and replay-driven strategy diagnostics.",
      "tags": [
        "Quantitative Trading",
        "Algorithmic Trading"
      ],
      "thumbnail": "/portfolio/projects/imc-prosperity.png",
      "githubLink": "https://github.com/KushagraBharti/IMC-Prosperity-4"
    },
    {
      "slug": "f1-optimization",
      "title": "F1 Optimization Project",
      "summary": "A custom F1-style racing simulation environment with OpenCV track extraction, Pygame rendering, ray-cast sensors, reward shaping, and RL training hooks.",
      "tags": [
        "Reinforcement Learning",
        "Gymnasium"
      ],
      "thumbnail": "/portfolio/projects/f1-optimization.png",
      "githubLink": "https://github.com/KushagraBharti/HackTX-2024---F1-Optimization"
    },
    {
      "slug": "beyond-chat",
      "title": "Beyond Chat",
      "summary": "An artifact-first AI workspace that turns chat into production workflows: studios, tool-calling runs, durable context, model comparison, storage-backed artifacts, and provider-aware orchestration.",
      "tags": [
        "TypeScript",
        "React"
      ],
      "thumbnail": "/portfolio/projects/beyond-chat.png",
      "githubLink": "https://github.com/KushagraBharti/Beyond-Chat"
    },
    {
      "slug": "kaggle-titanic-ml",
      "title": "Kaggle Titanic ML",
      "summary": "A complete beginner-to-intermediate ML pipeline for the Titanic dataset, focused on cleaning, feature engineering, model comparison, and documenting the full learning process.",
      "tags": [
        "Machine Learning",
        "Kaggle"
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
