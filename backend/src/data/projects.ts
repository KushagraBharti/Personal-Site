export interface ProjectData {
  title: string;
  summary: string;
  description: string[];
  tags: string[];
  githubLink: string;
}

export const projectsData: ProjectData[] = [ 
  { 
    title: "Algorithmic Trading Quantitative Test Environment", 
    summary: "A fully modular, end-to-end algorithmic trading environment for historical data analysis, strategy simulation, and performance evaluation.",
    description: [
      "Engineered an end-to-end trading environment leveraging the Alpaca API to fetch, process, and analyze 1-year of historical stock market data (AAPL), enabling quantitative strategy development and validation.",
      "Implemented a dynamic Moving Average Crossover strategy (20-day & 50-day windows) that generated seamless buy/sell signals and trade logs, facilitating iterative strategy refinements.",
      "Performed robust backtesting using a custom Backtester class, accounting for transaction costs and computing comprehensive KPIs (Sharpe Ratio, Max Drawdown, Final Return), resulting in a measurable performance baseline.",
      "Executed advanced feature engineering, including rolling-window computations for moving averages and returns, reducing signal noise and improving predictive capabilities.",
      "Developed comprehensive visualization pipelines with Matplotlib, including equity curves and annotated signal plots, enhancing interpretability and accelerating strategy optimization.",
      "Integrated with AWS paper trading endpoints to simulate near-real-time execution, placing automated market orders, verifying fills, and bridging historical simulations with practical execution scenarios."
    ], 
    tags: ["Python", "Alpaca API", "Pandas", "NumPy", "Matplotlib", "scikit-learn"], 
    githubLink: "#" 
  },
  {
    "title": "Personal Portfolio Website",
    "summary": "A TypeScript-based Node.js/Express and React single-page application for showcasing projects, experiences, and education.",
    "description": [
      "Developed a full-stack personal portfolio website featuring a TypeScript-based Node.js/Express backend and a React frontend, dynamically rendering data-driven sections with <40ms average response times.",
      "Implemented a modular RESTful API with 3 primary resource endpoints and 7 total routes, facilitating efficient data retrieval and reducing code complexity by ~30%.",
      "Structured backend code into controllers, routes, and typed data models to enhance scalability, readability, and maintainability.",
      "Leveraged TypeScript interfaces for strict type-checking, minimizing runtime errors and accelerating development speed by ~10%.",
      "Utilized Axios and async React hooks to fetch and render data seamlessly, reducing frontend load time by ~25% and enabling real-time updates without full page reloads.",
      "Configured CORS policies to securely allow requests from ~6 trusted domains, enabling smooth CI/CD workflows across multiple deployment environments.",
      "Adopted Tailwind CSS for rapid UI prototyping and a responsive design, cutting UI development time by ~50% and ensuring a cohesive brand aesthetic across all devices.",
      "Integrated modal-based user interactions for viewing detailed project and experience information, improving user engagement and retention by ~10%.",
      "Applied environment variables (e.g., VITE_API_BASE_URL) to simplify production deployments and support environment-specific configurations.",
      "Implemented graceful error handling, including 404 responses for invalid IDs, enhancing reliability and reducing user drop-offs by ~20%."
    ],
    "tags": ["TypeScript", "Node.js", "Express.js", "React", "Tailwind CSS", "Vite"
    ],
    "githubLink": "#"
  },
  {
    "title": "DataDrive: Unified Insights for Data & Fuel Optimization",
    "summary": "A full-stack AI-driven data analytics and prediction platform integrating ML models, data observability, and interactive visualizations.",
    "description": [
    "Developed an end-to-end data analytics platform integrating a Flask-based backend and a Vite (React+TypeScript) frontend to predict and visualize vehicle fuel efficiency and environmental impact metrics.",
    "Implemented a trained Linear Regression model (scikit-learn) with scaled input features (engine displacement, cylinders, city/highway fuel efficiency, CO2 emissions), achieving stable predictive performance and enabling data-driven maintenance recommendations.",
    "Leveraged a K-Means clustering model with PCA-driven dimensionality reduction to categorize vehicles into distinct efficiency groups and displayed these clusters via interactive D3.js scatter plots, improving interpretability and enabling targeted optimization strategies.",
    "Employed SHAP-based explanations to highlight key model-driving features, increasing transparency and fostering user trust in the ML insights.",
    "Set up real-time anomaly detection using APScheduler-based periodic tasks and logging for data observability, proactively identifying unusual consumption patterns and ensuring long-term system reliability.",
    "Integrated IPFS (Pinata) endpoints for secure, decentralized logging of predictions and reports, maintaining immutable data records and facilitating robust auditability.",
    "Enhanced frontend interaction with a 3D car model (React-Three-Fiber) and TailwindCSS styling, improving the UI/UX for both technical and non-technical stakeholders.",
    "Incorporated OpenAI-driven prompt-based explanations, automatically generating accessible narrative summaries of complex model outputs, streamlining stakeholder decision-making.",
    "Implemented containerization (Docker) and Git-based version control, ensuring reproducible deployments and scalable infrastructure for evolving datasets and models.",
    "Ultimately delivered a unified, AI-driven solution blending ML predictions, cluster-based insights, secure logging, and intuitive visualizations to guide effective fuel optimization strategies."
    ],
    "tags": ["Flask", "React", "TypeScript", "TailwindCSS", "D3.js", "scikit-learn", "APScheduler", "IPFS", "OpenAI", "Docker", "AWS"],
    "githubLink": "#"
  },  
  { 
    title: "Circuit Seer (Circuit Solver)", 
    summary: "A computer vision-based circuit solver using a fine-tuned YOLOv5 model.",
    description: [
      "Fine-tuned a YOLOv5 model on a custom dataset over 10 epochs, achieving 84% object detection accuracy to enable precise circuit mapping using a Hough transform algorithm.",
      "Developed a Python-based application using YOLOv5, PyTorch, and image processing techniques to efficiently analyze and solve circuits for resistance and capacitance."
    ], 
    tags: ["Python", "YOLOv5", "PyTorch", "OpenCV", "matplotlib", "Computer Vision"], 
    githubLink: "#" 
  },
  { 
    title: "To Do List App", 
    summary: "Task management app using the PERN stack with user authentication.",
    description: [
      "Built a task management system using the PERN stack, featuring user authentication and an intuitive slider-style task completion, enhancing user experience and allowing progress to be saved through personal logins."
    ], 
    tags: ["PostgreSQL", "SQL", "Express", "React", "Node.js", "Kinsta"], 
    githubLink: "https://github.com/KushagraBharti/To-Do-App-v1" 
  },
  { 
    title: "Age & Gender Recognition", 
    summary: "Face detection model with age and gender prediction using OpenCV.",
    description: [
      "Implemented face detection with machine learning model, achieving 71% gender and 62% age prediction accuracy using OpenCV’s confidence matrix in Python after extensive testing."
    ], 
    tags: ["Python", "OpenCV", "Computer Vision", "Machine Learning"], 
    githubLink: "https://github.com/KushagraBharti/Gender-Age-Detection" 
  },
  { 
    title: "Point Cloud Down Sampler", 
    summary: "Down-sampling tool for point clouds with voxelization techniques.",
    description: [
      "Down sampled a 370,277-point cloud while maintaining shape, achieving a reduction of 300 or 40,000 points depending on pre-defined voxel size, by employing a mathematical model for Voxelization in Python."
    ], 
    tags: ["Python", "Pandas", "Data-driven", "Voxelization"], 
    githubLink: "#" 
  },
  { 
    title: "Maze Traversal", 
    summary: "Maze-solving algorithm using depth-first search in Python.",
    description: [
      "Achieved a maze-solving time of 0.1279 by developing a depth-first search (DFS) traversal algorithm in Python, efficiently solving a 12x12 nested list maze."
    ], 
    tags: ["Python", "Depth-First Search Algorithm"], 
    githubLink: "#" 
  },
  { 
    title: "Kaggle Titanic Machine Learning Model", 
    summary: "Machine learning models for the Titanic dataset with data preprocessing.",
    description: [
      "Achieved an 86.76% accuracy by implementing and comparing multiple machine learning models (Random Forest, Decision Tree, KNN, Logistic Regression, etc.) on the Titanic dataset after extensive data preprocessing and feature engineering using Python, Pandas, and Scikit-learn."
    ], 
    tags: ["Python", "Pandas", "Scikit-learn", "Seaborn", "Matplotlib"], 
    githubLink: "https://github.com/KushagraBharti/Kaggle-Titanic-Solution" 
  }
];
