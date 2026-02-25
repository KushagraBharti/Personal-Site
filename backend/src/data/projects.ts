export interface ProjectData {
  title: string;
  summary: string;
  description: string[];
  tags: string[];
  githubLink: string;
  thumbnail?: string;
}

export const projectsData: ProjectData[] = [ 
  { 
    title: "Algorithmic Trading Quantitative Test Environment", 
    summary: "A modular platform for automated trading strategy development, backtesting, and paper trading.", 
    description: [
      "Fetched 1-year historical AAPL data (2022–2023) via the Alpaca API, saving both raw and processed datasets for reproducibility.",
      "Engineered advanced features like rolling moving averages and returns to drive a dynamic 20/50-day Moving Average Crossover strategy.",
      "Performed rigorous backtesting with transaction cost modeling to compute key performance metrics (Sharpe Ratio, Max Drawdown, Final Return) and generate detailed trade logs.",
      "Integrated with Alpaca's paper trading system to simulate real-time order placement, monitor execution, and validate strategy performance.",
      "Developed visualization tools for plotting equity curves and annotating buy/sell signals, enhancing the interpretability of trading insights."
    ], 
    tags: ["Python", "Alpaca API", "Pandas", "NumPy", "Matplotlib", "scikit-learn", "Algorithmic Trading", "Backtesting", "Paper Trading"], 
    githubLink: "https://github.com/KushagraBharti/Quant-Test-Environment",
    thumbnail: "/quantTestEnv.svg",
  },

  {
  title: "Monopoly LLM Benchmark Platform",
  summary: "A deterministic, inspectable multi-agent AI simulation where large language models play full Monopoly games under strict rules, enabling reproducible benchmarking, debugging, and research into strategic reasoning and negotiation.",
  description: [
    "Designed and implemented a full Monopoly game engine from scratch with complete rule coverage—including auctions, trading, jail mechanics, building constraints, liquidation, and bankruptcy—ensuring deterministic outcomes via seeded randomness and strict turn enforcement.",
    "Built a modular AI decision orchestration layer that constrains LLMs to valid actions only, validates structured tool-call responses, retries invalid outputs once, and applies deterministic fallback actions to guarantee uninterrupted and reproducible gameplay.",
    "Developed a comprehensive telemetry and logging system that records every game event, decision request, model response, applied action, and state snapshot, enabling full replay, auditability, and deep post-hoc analysis of model behavior.",
    "Engineered a real-time FastAPI backend with WebSocket streaming to manage game lifecycles (start, pause, resume, stop) and broadcast events and snapshots live to a React-based frontend without desynchronization or state leakage.",
    "Created an interactive frontend UI that visualizes the Monopoly board, player states, auctions, trades, and event feed, while providing detailed inspection tools to view exact LLM prompts, tool schemas, responses, retries, and fallback reasons.",
    "Implemented robust verification pipelines to prevent silent failures, including contract schema validation, deterministic replay checks, non-overwriting run artifacts, and test suites that enforce correctness invariants such as turn order integrity.",
    "Refactored and hardened the codebase to enforce clear architectural boundaries between the game engine, AI arena, API server, telemetry layer, and frontend, making the system extensible, debuggable, and suitable as a long-term research platform.",
    "Designed the system with benchmarking and research in mind, enabling controlled experiments on long-horizon planning, negotiation dynamics, tool-use reliability, auction behavior, and multi-agent strategic reasoning across different LLMs."
  ],
  tags: [
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
  githubLink: "https://github.com/KushagraBharti/monopoly-llm-benchmark",
  thumbnail: "/monopolyBench.svg"
  },

  { 
    "title": "PseudoLawyer", 
    "summary": "An AI-powered real-time contract negotiation platform that uses a virtual mediator to resolve disputes and draft bespoke legal agreements.", 
    "description": [
      "Architected a real-time, multi-party negotiation platform using Next.js 15 and Supabase Realtime, enabling synchronized group chats between opposing parties.",
      "Engineered 'Sudo', an autonomous AI mediator powered by Anthropic's Claude 3.5 Sonnet, capable of understanding context, proposing compromises, and neutralizing heated debates in real-time.",
      "Implemented a smart 'Ask Sudo' triggering system that allows the AI to passively monitor the conversation and intervene only when explicitly invoked or needed.",
      "Built a contract generation engine that synthesizes the entire negotiation history into a professional, legally-structured document using LLM-driven drafting.",
      "Designed a premium, 'Glassmorphism' UI with Tailwind CSS and Framer Motion, featuring dark mode, typing indicators, and seamless role-based access control."
    ], 
    "tags": ["Next.js 15", "TypeScript", "Supabase", "Realtime", "PostgreSQL", "OpenRouter", "Anthropic Claude 3.5", "Tailwind CSS", "Framer Motion", "Legal Tech", "AI Agents"], 
    "githubLink": "https://github.com/KushagraBharti/PseudoLawyer", 
    "thumbnail": "/pseudoLawyer.svg"
  },
  
  { 
    title: "Personal Portfolio Website", 
    summary: "A dynamic, full-stack portfolio website showcasing professional experience, education, and projects.", 
    description: [
      "Developed a responsive single-page application using a TypeScript-based Node.js/Express backend and a React/TailwindCSS frontend, ensuring fast load times and seamless navigation.",
      "Implemented modular RESTful API endpoints to serve dynamic content (projects, education, experiences, intro) with secure CORS configurations and environment-based settings.",
      "Integrated external APIs for live updates, including GitHub stats, weather data, and LeetCode challenges, to reflect real-time achievements.",
      "Enhanced user experience through interactive UI elements such as draggable cards, parallax tilt effects, custom cursors, and animated transitions.",
      "Deployed the application on Vercel, optimizing for both development and production environments with robust TypeScript tooling."
    ], 
    tags: ["TypeScript", "Node.js", "Express", "React", "TailwindCSS", "Vite", "REST API", "Full-Stack Development", "API Integration"], 
    githubLink: "https://github.com/KushagraBharti/Personal-Site",
    thumbnail: "/personalPortfolio.svg",
  },  

  {
  title: "AutoHDR ML Lens Correction",
  summary: "Built a competition-grade automatic lens-correction pipeline that combines a CNN with analytic camera geometry (Brown–Conrady) for stable, reproducible distortion correction at full resolution.",
  description: [
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
  tags: [
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
  githubLink: "https://github.com/satvikh/autohdr-lenscorrection",
  thumbnail: "autohdr.png"
},

  {
    title: "Kaggle Titanic ML",
    summary: "Predicted Titanic survival using machine learning. This project involved extensive data cleaning, feature engineering, and model evaluation using various algorithms, with a comprehensive PDF outlining all my learnings.",
    description: [
      "Acquired the Titanic dataset from Kaggle and performed detailed data cleaning with Pandas—handling missing values, extracting titles from names, and engineering new features such as FamilySize and IsAlone.",
      "Conducted exploratory data analysis (EDA) using Seaborn and Matplotlib to reveal key insights about passenger demographics and survival correlations.",
      "Built and evaluated multiple models (Logistic Regression, SVM, KNN, Decision Tree, Random Forest, Naive Bayes, Perceptron, and SGD) with scikit-learn, achieving the best training accuracy (~86.76%) with Decision Tree and Random Forest models.",
      "Included a comprehensive PDF report that critically documents all the steps, challenges, and learnings throughout the project."
    ],
    tags: [
      "Machine Learning", "Kaggle", "Titanic", "Data Analysis", "Python",
      "Pandas", "scikit-learn", "EDA", "Feature Engineering", "Random Forest"
    ],
    githubLink: "https://github.com/KushagraBharti/Kaggle-Titanic-Solution",
    thumbnail: "/kaggleTitanic.svg"
  },

  {
    title: "F1 Optimization Project",
    summary: "A simulation-based F1 race optimization project using reinforcement learning. Built for HackTX-2024, it integrates a custom Pygame-based race environment with a SAC agent from Ray RLlib to optimize driving strategies on a realistic race track.",
    description: [
      "Developed a custom Gymnasium environment ('Race') that simulates an F1 track using Pygame and OpenCV for track extraction.",
      "Implemented a Car class with sensor-based perception (echo sensors) to inform both heuristic and RL-based control strategies.",
      "Integrated Ray Tune and RLlib's SACTrainer for training an RL agent, with functionality to restore from checkpoints and export training artifacts.",
      "Provided both manual control mode (via keyboard input) and an echo-heuristic agent for testing and debugging.",
      "Although the codebase contains extra legacy and experimental code snippets, the core functionality demonstrates effective application of RL in a simulated racing context."
    ],
    tags: ["Reinforcement Learning", "Ray RLlib", "Pygame", "OpenCV", "Simulation", "F1", "Optimization", "HackTX 2024","Gymnasium"
    ],
    githubLink: "https://github.com/KushagraBharti/HackTX-2024---F1-Optimization",
    thumbnail: "/f1Optimization.svg"
  },

  { 
    title: "DataDrive: Unified Insights for Data & Fuel Optimization", 
    summary: "A full-stack AI-driven analytics platform that integrates advanced ML models, real-time data observability, and interactive visualizations for fuel optimization.", 
    description: [
      "Developed a modular Flask backend with multiple API endpoints for fuel efficiency prediction, car details retrieval, and clustering analysis using pre-trained Linear Regression and K-Means models.",
      "Implemented robust services including scheduled anomaly detection with APScheduler, SHAP-based interpretability, and comprehensive data observability with automated logging.",
      "Integrated advanced external services such as GPT-4 powered explanation generation for model outputs and Pinata for decentralized file storage, enhancing transparency and auditability.",
      "Engineered end-to-end training pipelines for both regression (evaluated via MAE and R² metrics) and clustering models (using PCA for visualization), ensuring actionable insights.",
      "Built a modern React dashboard featuring interactive D3.js charts, real-time fuel efficiency predictions, a 3D car model viewer via react-three-fiber, and dynamic cluster visualizations."
    ], 
    tags: ["Flask", "Python", "Machine Learning", "Linear Regression", "KMeans", "APScheduler", "SHAP", "OpenAI", "Pinata", "React", "D3.js", "Three.js", "Data Analytics"], 
    githubLink: "https://github.com/KushagraBharti/HACKUTD-Data-Drive",
    thumbnail: "/dataDrive.svg",
  },
  
  {
    title: "CircuitSeer (Circuit Solver)",
    summary: "An AI-powered circuit analysis tool that automates the identification and schematic analysis of electronic circuits for both educational and practical use.",
    description: [
      "Developed under the AI Mentorship Program at the University of Texas at Dallas, CircuitSeer automatically analyzes circuit diagrams by accurately detecting and classifying electronic components.",
      "Utilizes a fine-tuned YOLOv5 model for fast and precise object detection to identify components such as resistors, capacitors, and more within complex layouts.",
      "Integrates classical computer vision techniques—namely Canny Edge Detection and Hough Transform—to trace wiring and delineate circuit structures.",
      "Built using Python and Flask, it seamlessly bridges backend processing with a user-friendly web interface, allowing users to upload diagrams and receive detailed, step-by-step schematic insights.",
      "Designed to support students and professionals alike in understanding circuit design, troubleshooting, and exam preparation."
    ],
    tags: ["Python", "YOLOv5", "Flask", "OpenCV", "Computer Vision", "Canny Edge Detection", "Hough Transform"],
    githubLink: "https://github.com/Hteam121/circuit-seer",
    thumbnail: "/circuitSeer.svg",
  },
    
  { 
    title: "Age & Gender Recognition", 
    summary: "Real-time face detection with age and gender prediction using OpenCV and Caffe models.", 
    description: [
      "Developed a real-time system that leverages OpenCV’s dnn module to detect faces in live video streams and dynamically annotate them.",
      "Utilized pre-trained Caffe models for age and gender classification, achieving approximately 71% accuracy for gender and 62% for age predictions.",
      "Optimized detection by fine-tuning confidence thresholds and applying padding to accurately extract facial regions.",
      "Integrated a robust pipeline that draws bounding boxes and overlays prediction labels on faces for intuitive visual feedback."
    ], 
    tags: ["Python", "OpenCV", "DNN", "Caffe", "Face Detection", "Real-Time Processing"], 
    githubLink: "https://github.com/KushagraBharti/Gender-Age-Detection",
    thumbnail: "/ageGenderRec.svg",
  },
  
  { 
    title: "Point Cloud Down Sampler", 
    summary: "A dual-approach tool for reducing dense point clouds via custom voxelization and Open3D’s high-performance voxel grid method.", 
    description: [
      "Developed a custom algorithm that groups 3D points into discrete voxels using mathematical flooring, significantly reducing dataset size while preserving shape integrity.",
      "Leveraged Open3D’s built-in voxel_down_sample() for rapid, efficient downsampling and interactive 3D visualization, showcasing superior performance and ease-of-use.",
      "Engineered a complete pipeline that converts CSV point cloud data into PCD format, applies both methods, and exports downsampled outputs for further analysis.",
      "Demonstrated versatility by comparing a from-scratch implementation with a state-of-the-art library approach to optimize for both accuracy and processing speed."
    ], 
    tags: ["Python", "Pandas", "Open3D", "Voxelization", "Point Cloud", "Downsampling", "Math Modeling"], 
    githubLink: "https://github.com/KushagraBharti/PointCloud-DownSampler",
    thumbnail: "/pointCloud.svg",
  },  

  {
    title: "Maze Traversal",
    summary: "A recursive depth-first search maze-solving algorithm in Python.",
    description: [
      "Implemented a Maze_Crawler class that solves a maze represented as a nested list using recursion and DFS.",
      "The algorithm marks the solution path with directional arrows (v, ^, >, <) to visually trace the route from the start ('S') to the exit ('E').",
      "Includes functionality to load maze configurations from a text file, identify the starting point, and print intermediate maze states for real-time progress tracking.",
      "Measures execution time to evaluate performance, offering a concise and efficient educational tool for understanding recursive algorithms."
    ],
    tags: ["Python", "Depth-First Search", "Recursion", "Maze Solving"],
    githubLink: "#",
    thumbnail: "/mazeTraversal.svg",
  },  
  
  { 
    title: "PCB Design Project", 
    summary: "A Senior Independent Project in 2023 that provided hands-on experience in designing, ordering, and assembling custom PCBs.", 
    description: [
      "Designed and ordered multiple PCBs using EasyEDA, experiencing the entire workflow from schematic capture to layout and manufacturing.",
      "Sourced and selected electrical components from integrated platforms like LCSC and JLCPCB, balancing cost, availability, and performance.",
      "Developed a deep understanding of key PCB parameters, including size, thermal management, component placement, power and signal integrity, and manufacturing constraints.",
      "Addressed design challenges such as handling multiple ATmega328 variants, integrating both SMD and THT components, and implementing capacitive touch buttons.",
      "Gained practical soldering and testing skills, ensuring reliable assembly and real-world functionality."
    ], 
    tags: ["PCB Design", "Circuit Design", "EasyEDA", "JLCPCB", "Electronics", "Hardware", "Soldering"], 
    githubLink: "https://github.com/KushagraBharti/PCB-Design-Project", 
    thumbnail: "/pcbDesign.svg",
  },

  {
    title: "Self-Driving Car Project",
    summary: "Repurposed an RC car into a self-driving vehicle using Arduino hardware and a custom obstacle avoidance algorithm.",
    description: [
      "Tore apart an RC car, rebuilt its interior with an Arduino Uno and motor shield, and rewired all components (including integrating ultrasonic sensors and new soldering) for improved functionality.",
      "Developed C++ code that reads ultrasonic sensor data to implement an obstacle detection and avoidance algorithm, enabling autonomous navigation through complex environments."
    ],
    tags: ["Arduino", "C++", "Self-Driving", "Autonomous Vehicle", "RC Car", "Electronics", "Ultrasonic Sensors", "Hardware"],
    githubLink: "",
    thumbnail: "/selfDrivingCar.svg"
  },
  
];
