"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsData = void 0;
exports.projectsData = [
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
