# Personal Portfolio Website - Complete Repository Guide

> **A comprehensive walkthrough and technical documentation for kushagrabharti.com**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [API Reference](#6-api-reference)
7. [Components Guide](#7-components-guide)
8. [Styling System](#8-styling-system)
9. [External Integrations](#9-external-integrations)
10. [Configuration Files](#10-configuration-files)
11. [Development Setup](#11-development-setup)
12. [Deployment Guide](#12-deployment-guide)
13. [Data Models](#13-data-models)
14. [Performance Optimizations](#14-performance-optimizations)
15. [Security Considerations](#15-security-considerations)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Overview

### About This Project

**Project Name:** Personal Portfolio Website
**Live URL:** [https://www.kushagrabharti.com](https://www.kushagrabharti.com)
**Repository:** [https://github.com/KushagraBharti/Personal-Site](https://github.com/KushagraBharti/Personal-Site)
**Type:** Full-stack Portfolio/Personal Website
**Created by:** Kushagra Bharti - Software Engineer & ML Enthusiast

### Purpose

A dynamic, full-stack portfolio website designed to showcase professional experience, education, projects, and real-time achievements. The site features:

- **Interactive UI Elements** - Draggable cards, parallax effects, and smooth animations
- **Live Data Integration** - Real-time GitHub stats, weather data, and LeetCode progress
- **Private Execution Tracker** - Personal productivity management dashboard with Supabase backend
- **Responsive Design** - Optimized for both desktop and mobile experiences
- **Glassmorphism Design** - Modern UI with frosted glass effects and gradient backgrounds

### Key Features

| Feature | Description |
|---------|-------------|
| **Dynamic Portfolio** | Showcases projects, experience, and education with modal details |
| **Live GitHub Stats** | Real-time repository count and total commits |
| **Weather Widget** | Location-aware weather display |
| **LeetCode Progress** | Problem-solving statistics |
| **Interactive Pong Game** | Playable mini-game on the intro section |
| **Draggable Cards** | Desktop users can rearrange intro cards |
| **Private Tracker** | Full-featured task management with Supabase |
| **Keyboard Shortcuts** | Quick navigation (H for home, T for tracker) |

---

## 2. Repository Structure

### Complete Directory Tree

```
Personal-Site/
│
├── README.md                              # Project overview and quick start
├── REPOSITORY_GUIDE.md                    # This comprehensive guide
├── personal-site-preview.png              # Preview screenshot
├── .gitignore                             # Root git ignore rules
│
├── .claude/                               # Claude AI workspace settings
│
├── frontend/                              # React TypeScript Frontend
│   ├── package.json                       # Frontend dependencies & scripts
│   ├── package-lock.json                  # NPM lock file
│   ├── bun.lock                           # Bun package manager lock
│   ├── tsconfig.json                      # TypeScript config (references)
│   ├── tsconfig.app.json                  # App TypeScript settings
│   ├── tsconfig.node.json                 # Node/build TypeScript settings
│   ├── vite.config.ts                     # Vite bundler configuration
│   ├── tailwind.config.js                 # Tailwind CSS customization
│   ├── postcss.config.js                  # PostCSS processing pipeline
│   ├── eslint.config.js                   # ESLint + Prettier rules
│   ├── index.html                         # HTML entry point for SPA
│   ├── .env.local                         # Development environment variables
│   ├── .env.production                    # Production environment variables
│   ├── .gitignore                         # Frontend-specific git ignore
│   ├── .yarnrc.yml                        # Yarn configuration
│   │
│   ├── public/                            # Static assets (served as-is)
│   │   ├── SelfPic.jpg                    # Personal photograph
│   │   ├── SelfPic.svg                    # Personal photo (SVG version)
│   │   ├── vite.svg                       # Vite logo
│   │   │
│   │   └── [Project Thumbnails]           # SVG icons for each project
│   │       ├── quantTestEnv.svg           # Quant trading project
│   │       ├── monopolyBench.svg          # Monopoly benchmark
│   │       ├── pseudoLawyer.svg           # Legal AI assistant
│   │       ├── personalPortfolio.svg      # This website
│   │       ├── dataDrive.svg              # Data analytics project
│   │       ├── kaggleTitanic.svg          # Kaggle ML project
│   │       ├── f1Optimization.svg         # F1 reinforcement learning
│   │       ├── circuitSeer.svg            # Circuit detection AI
│   │       ├── ageGenderRec.svg           # Age/gender recognition
│   │       ├── pointCloud.svg             # Point cloud processing
│   │       ├── mazeTraversal.svg          # Maze algorithm
│   │       ├── pcbDesign.svg              # PCB design project
│   │       ├── selfDrivingCar.svg         # Arduino self-driving car
│   │       ├── brain.svg                  # Generic AI/ML icon
│   │       └── error.svg                  # Error placeholder
│   │
│   └── src/                               # Source code
│       ├── main.tsx                       # React entry point (renders App)
│       ├── App.tsx                        # Main app with routing
│       ├── App.css                        # App-specific styles
│       ├── index.css                      # Global styles + Tailwind
│       ├── vite-env.d.ts                  # Vite type definitions
│       │
│       ├── pages/                         # Route-level components
│       │   ├── Home.tsx                   # Main portfolio page (/)
│       │   └── Tracker.tsx                # Private task tracker (/tracker)
│       │
│       ├── components/                    # Reusable components
│       │   ├── Intro.tsx                  # Hero section with draggable cards
│       │   ├── About.tsx                  # About me section
│       │   ├── Education.tsx              # Education timeline
│       │   ├── Experience.tsx             # Work experience section
│       │   ├── Projects.tsx               # Projects showcase
│       │   ├── Contact.tsx                # Contact information
│       │   ├── WeatherCard.tsx            # Live weather widget
│       │   ├── LeetCodeStatsCard.tsx      # LeetCode statistics widget
│       │   ├── PongGame.tsx               # Interactive Pong game
│       │   ├── ScrollProgress.tsx         # Top scroll progress bar
│       │   ├── SectionSidebar.tsx         # Navigation dots sidebar
│       │   │
│       │   └── ui/                        # Base UI components
│       │       ├── GlassCard.tsx          # Glassmorphism card container
│       │       ├── GlassButton.tsx        # Glassmorphism button
│       │       ├── GlassInput.tsx         # Glassmorphism text input
│       │       ├── GlassTextarea.tsx      # Glassmorphism textarea
│       │       ├── AnimatedGlassCard.tsx  # Glass card with animations
│       │       ├── CustomCursor.tsx       # Custom cursor component
│       │       └── LazyIframe.tsx         # Lazy-loaded iframe
│       │
│       ├── lib/                           # Utility libraries
│       │   └── supabaseClient.ts          # Supabase client initialization
│       │
│       └── types/                         # TypeScript type definitions
│           └── tracker.ts                 # Tracker page interfaces
│
└── backend/                               # Node.js Express Backend
    ├── package.json                       # Backend dependencies & scripts
    ├── tsconfig.json                      # TypeScript configuration
    ├── bun.lock                           # Bun package manager lock
    ├── vercel.json                        # Vercel deployment config
    ├── .env                               # Environment variables (secrets)
    ├── .env.example                       # Environment template
    ├── .gitignore                         # Backend git ignore
    ├── .yarnrc.yml                        # Yarn configuration
    │
    └── src/                               # Source code
        ├── server.ts                      # Server entry point
        ├── app.ts                         # Express app configuration
        │
        ├── config/                        # Configuration modules
        │   └── github.ts                  # GitHub API configuration
        │
        ├── routes/                        # API route definitions
        │   ├── projectRoutes.ts           # /api/projects endpoints
        │   ├── experienceRoutes.ts        # /api/experiences endpoints
        │   ├── educationRoutes.ts         # /api/education endpoints
        │   ├── introRoutes.ts             # /api/intro endpoint
        │   ├── githubRoutes.ts            # /api/github/stats endpoint
        │   ├── weatherRoutes.ts           # /api/weather endpoint
        │   └── leetcodeRoutes.ts          # /api/leetcode/stats endpoint
        │
        ├── controllers/                   # Request handlers
        │   ├── projectController.ts       # Project data logic
        │   ├── experienceController.ts    # Experience data logic
        │   ├── educationController.ts     # Education data logic
        │   ├── introController.ts         # Intro + live stats logic
        │   ├── githubController.ts        # GitHub stats logic
        │   ├── weatherController.ts       # Weather API proxy logic
        │   └── leetcodeController.ts      # LeetCode stats logic
        │
        ├── services/                      # Business logic services
        │   └── githubStatsService.ts      # GitHub API client + caching
        │
        └── data/                          # Static data files
            ├── projects.ts                # Projects array (14 projects)
            ├── experiences.ts             # Experiences array (5 entries)
            ├── education.ts               # Education array (2 entries)
            └── intro.ts                   # Personal intro data
```

### Key Files Quick Reference

| File | Purpose | Location |
|------|---------|----------|
| `App.tsx` | Main application with routing | `frontend/src/` |
| `Home.tsx` | Portfolio home page | `frontend/src/pages/` |
| `Tracker.tsx` | Private task tracker | `frontend/src/pages/` |
| `server.ts` | Backend entry point | `backend/src/` |
| `app.ts` | Express configuration | `backend/src/` |
| `projects.ts` | Static project data | `backend/src/data/` |
| `githubStatsService.ts` | GitHub API integration | `backend/src/services/` |
| `supabaseClient.ts` | Supabase initialization | `frontend/src/lib/` |
| `index.css` | Global styles + glassmorphism | `frontend/src/` |
| `tailwind.config.js` | Tailwind customization | `frontend/` |

---

## 3. Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Language** | TypeScript | 5.6.3 | Type-safe JavaScript |
| **Framework** | React | 18.3.1 | UI component library |
| **Build Tool** | Vite | 5.4.10 | Fast bundler and dev server |
| **Styling** | TailwindCSS | 3.4.14 | Utility-first CSS framework |
| **Routing** | React Router DOM | 6.27.0 | Client-side routing |
| **HTTP Client** | Axios | 1.7.7 | API requests |
| **Animations** | Framer Motion | 12.6.2 | Declarative animations |
| **Drag & Drop** | react-draggable | - | Draggable card functionality |
| **3D Effects** | react-parallax-tilt | - | Parallax tilt on cards |
| **Typewriter** | react-simple-typewriter | 5.0.1 | Typing animation effect |
| **Icons** | react-icons | 5.5.0 | Icon library |
| **Database Client** | @supabase/supabase-js | 2.87.1 | Supabase SDK |
| **CSS Processing** | PostCSS | 8.4.47 | CSS transformations |
| **CSS Prefixing** | Autoprefixer | - | Vendor prefixes |
| **Linting** | ESLint | 9.13.0 | Code quality |
| **Formatting** | Prettier | 3.3.3 | Code formatting |

### Backend Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Language** | TypeScript | 5.8.2 | Type-safe JavaScript |
| **Runtime** | Node.js | - | JavaScript runtime |
| **Framework** | Express.js | 4.21.1 | Web server framework |
| **HTTP Client** | Axios | 1.8.4 | External API requests |
| **CORS** | cors | 2.8.5 | Cross-origin handling |
| **Environment** | dotenv | 16.4.5 | Environment variables |
| **Development** | nodemon | 3.1.9 | Hot reload in development |
| **TS Execution** | ts-node | 10.9.2 | Run TypeScript directly |

### External Services

| Service | Purpose | Authentication |
|---------|---------|----------------|
| **GitHub API** | Repository and commit statistics | Personal Access Token |
| **OpenWeatherMap** | Real-time weather data | API Key |
| **LeetCode Stats API** | Problem-solving statistics | Username only |
| **Supabase** | Database + Authentication | URL + Anon Key |
| **Vercel** | Hosting and deployment | Account-based |

### Package Managers

The project supports multiple package managers:

- **Bun** (recommended) - Fast, modern package manager
- **npm** - Standard Node.js package manager
- **Yarn** - Alternative package manager (configured via `.yarnrc.yml`)

---

## 4. Backend Architecture

### Overview

The backend follows a layered architecture pattern:

```
Routes → Controllers → Services → External APIs / Data
```

### Server Entry Point

**File:** `backend/src/server.ts`

```typescript
// Loads environment variables
import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Express Application

**File:** `backend/src/app.ts`

The Express app is configured with:

1. **CORS Middleware** - Strict origin whitelist for security
2. **JSON Parser** - Parses incoming JSON requests
3. **Route Registration** - Mounts all API routes

#### CORS Configuration

```typescript
const allowedOrigins = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',

  // Production domains
  'https://www.kushagrabharti.com',
  'https://kushagrabharti.com',
];

// Dynamic patterns for Vercel deployments
const dynamicPatterns = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,  // Vercel preview URLs
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Local LAN
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,  // Private network
];
```

### Routes

| Route File | Base Path | Endpoints |
|------------|-----------|-----------|
| `projectRoutes.ts` | `/api/projects` | `GET /`, `GET /:id` |
| `experienceRoutes.ts` | `/api/experiences` | `GET /`, `GET /:id` |
| `educationRoutes.ts` | `/api/education` | `GET /`, `GET /:id` |
| `introRoutes.ts` | `/api/intro` | `GET /` |
| `githubRoutes.ts` | `/api/github` | `GET /stats` |
| `weatherRoutes.ts` | `/api/weather` | `GET /` |
| `leetcodeRoutes.ts` | `/api/leetcode` | `GET /stats` |

### Controllers

Each controller handles the business logic for its respective route:

#### Project Controller
**File:** `backend/src/controllers/projectController.ts`

```typescript
export const getAllProjects = (req, res) => {
  res.json(projectsData);
};

export const getProjectById = (req, res) => {
  const id = parseInt(req.params.id);
  if (id < 0 || id >= projectsData.length) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(projectsData[id]);
};
```

#### Intro Controller
**File:** `backend/src/controllers/introController.ts`

This controller aggregates data from multiple sources:

```typescript
export const getIntroData = async (req, res) => {
  // Fetch GitHub stats (cached)
  const githubStats = await fetchGitHubStats();

  // Fetch weather for Austin, TX
  const weatherResponse = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=Austin&units=imperial&appid=${API_KEY}`
  );

  // Return combined data
  res.json({
    ...introData,
    githubStats,
    weather: weatherResponse.data,
  });
};
```

### Services

#### GitHub Stats Service
**File:** `backend/src/services/githubStatsService.ts`

Handles GitHub API integration with intelligent caching:

```typescript
// In-memory cache
let cache = {
  data: null,
  timestamp: 0,
};

const TTL = process.env.GITHUB_STATS_TTL_MS || 600000; // 10 minutes

export async function fetchGitHubStats(forceRefresh = false) {
  // Check cache validity
  if (!forceRefresh && cache.data && Date.now() - cache.timestamp < TTL) {
    return { ...cache.data, cached: true };
  }

  // Fetch all repositories with pagination
  const repos = await fetchAllRepos();

  // Calculate total commits across all repos
  const totalCommits = await calculateTotalCommits(repos);

  // Update cache
  cache = {
    data: { totalRepos: repos.length, totalCommits },
    timestamp: Date.now(),
  };

  return cache.data;
}
```

**Key Features:**
- Pagination support (100 repos per page)
- Link header parsing for efficient commit counting
- In-memory caching with configurable TTL
- Force refresh capability via query parameter
- Error handling for empty/inaccessible repositories

### Static Data

All portfolio content is stored in TypeScript files for type safety:

#### Projects Data Structure
**File:** `backend/src/data/projects.ts`

```typescript
export interface Project {
  title: string;
  summary: string;
  description: string[];
  tags: string[];
  githubLink: string;
  thumbnail?: string;
}

export const projectsData: Project[] = [
  {
    title: "Algorithmic Trading Quantitative Test Environment",
    summary: "Python-based quant trading simulation platform",
    description: [
      "Built backtesting framework with Alpaca API integration",
      "Implemented multiple trading strategies with risk management",
      // ...
    ],
    tags: ["Python", "Alpaca API", "Pandas", "NumPy"],
    githubLink: "https://github.com/...",
    thumbnail: "/quantTestEnv.svg"
  },
  // ... 13 more projects
];
```

#### Experience Data Structure
**File:** `backend/src/data/experiences.ts`

```typescript
export interface Experience {
  position: string;
  summary: string;
  description: string[];
  tags: string[];
  companyLink: string;
}

export const experiencesData: Experience[] = [
  {
    position: "Undergraduate Researcher - Drone Coverage Planning",
    summary: "UT Dallas research on autonomous drone path optimization",
    description: [
      "Developed algorithms for optimal coverage path planning",
      // ...
    ],
    tags: ["Python", "ROS", "Path Planning", "Optimization"],
    companyLink: "https://utdallas.edu"
  },
  // ... 4 more experiences
];
```

---

## 5. Frontend Architecture

### Application Structure

**File:** `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Tracker = lazy(() => import('./pages/Tracker'));

function App() {
  return (
    <BrowserRouter>
      <ScrollProgress />
      <SectionSidebar />
      <GlobalHotkeys />

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tracker" element={<Tracker />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Pages

#### Home Page
**File:** `frontend/src/pages/Home.tsx`

The main portfolio page that lazy-loads all sections:

```typescript
const Intro = lazy(() => import('../components/Intro'));
const About = lazy(() => import('../components/About'));
const Education = lazy(() => import('../components/Education'));
const Experience = lazy(() => import('../components/Experience'));
const Projects = lazy(() => import('../components/Projects'));

function Home() {
  // Prefetch sections during idle time
  useEffect(() => {
    requestIdleCallback(() => {
      // Preload section components
    });
  }, []);

  return (
    <main>
      <section id="intro"><Intro /></section>
      <section id="about"><About /></section>
      <section id="education"><Education /></section>
      <section id="experience"><Experience /></section>
      <section id="projects"><Projects /></section>
    </main>
  );
}
```

#### Tracker Page
**File:** `frontend/src/pages/Tracker.tsx`

A private productivity dashboard with full CRUD functionality:

**Features:**
- Weekly task management with templates
- Task completion tracking with proof URLs
- Weekly snapshot summaries for goals
- Pipeline management (internships, traction, relationships)
- Category-based organization with drag-reorder
- Archive functionality
- Multi-week navigation

**Supabase Tables Used:**
- `weekly_task_templates` - Task template definitions
- `weekly_task_status` - Weekly task completion records
- `weekly_snapshots` - End-of-week summaries
- `pipeline_items` - Opportunity tracking

### Component Hierarchy

```
App
├── ScrollProgress (fixed top bar)
├── SectionSidebar (fixed right navigation)
├── GlobalHotkeys (keyboard shortcuts)
│
└── Routes
    ├── Home (/)
    │   ├── Intro
    │   │   ├── Draggable[PersonalPhoto]
    │   │   ├── Draggable[LatestUpdate]
    │   │   ├── Draggable[FeaturedBlog]
    │   │   ├── Draggable[FunFact]
    │   │   ├── Draggable[PongGame]
    │   │   ├── Draggable[WeatherCard]
    │   │   ├── Draggable[LeetCodeStatsCard]
    │   │   └── Draggable[GitHubStats]
    │   │
    │   ├── About
    │   │   └── LazyIframe (embedded content)
    │   │
    │   ├── Education
    │   │   └── EducationCard[] (with modals)
    │   │
    │   ├── Experience
    │   │   └── ExperienceCard[] (with modals)
    │   │
    │   └── Projects
    │       └── ProjectCard[] (with modals)
    │
    └── Tracker (/tracker)
        ├── AuthSection (login/logout)
        ├── WeekNavigation
        ├── TaskTemplates (CRUD)
        ├── TaskStatus (completion tracking)
        ├── WeeklySnapshot (goal summary)
        └── PipelineSection
            ├── InternshipPipeline
            ├── TractionPipeline
            └── RelationshipPipeline
```

### State Management

The application uses React's built-in state management:

- **useState** - Local component state
- **useEffect** - Side effects and data fetching
- **useRef** - DOM references and mutable values
- **Custom Hooks** - Encapsulated stateful logic

**Data Fetching Pattern:**
```typescript
function useProjectData() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem('projects');
    if (cached) {
      setProjects(JSON.parse(cached));
      setLoading(false);
      return;
    }

    // Fetch from API
    axios.get(`${API_BASE_URL}/api/projects`)
      .then(res => {
        setProjects(res.data);
        sessionStorage.setItem('projects', JSON.stringify(res.data));
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading, error };
}
```

### Supabase Client

**File:** `frontend/src/lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 6. API Reference

### Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000` |
| Production | `https://personal-site-orpin-chi-99.vercel.app` |

### Endpoints

#### GET /api/projects

Returns all projects.

**Response:**
```json
[
  {
    "title": "Algorithmic Trading Quantitative Test Environment",
    "summary": "Python-based quant trading simulation platform",
    "description": ["...", "..."],
    "tags": ["Python", "Alpaca API", "Pandas"],
    "githubLink": "https://github.com/...",
    "thumbnail": "/quantTestEnv.svg"
  }
]
```

#### GET /api/projects/:id

Returns a single project by index.

**Parameters:**
- `id` (path) - Project index (0-13)

**Response:** Single project object or 404 error

---

#### GET /api/experiences

Returns all work experiences.

**Response:**
```json
[
  {
    "position": "Undergraduate Researcher",
    "summary": "UT Dallas research position",
    "description": ["...", "..."],
    "tags": ["Python", "ROS"],
    "companyLink": "https://utdallas.edu"
  }
]
```

#### GET /api/experiences/:id

Returns a single experience by index.

---

#### GET /api/education

Returns all education entries.

**Response:**
```json
[
  {
    "dateRange": "2023 - Present",
    "position": "University of Texas at Dallas",
    "focus": "BS Computer Science, Data Science & ML Focus",
    "description": "...",
    "schoolLink": "https://utdallas.edu"
  }
]
```

#### GET /api/education/:id

Returns a single education entry by index.

---

#### GET /api/intro

Returns combined intro data with live statistics.

**Response:**
```json
{
  "personalPhoto": "/SelfPic.jpg",
  "latestUpdate": "Currently working on...",
  "funFact": "I've visited 15 countries!",
  "featuredBlog": {
    "title": "My Journey into ML",
    "link": "https://medium.com/..."
  },
  "aiProjects": ["Project 1", "Project 2"],
  "travelPlans": "Planning to visit Japan",
  "githubStats": {
    "totalRepos": 45,
    "totalCommits": 1234,
    "cached": true
  },
  "weather": {
    "name": "Austin",
    "main": { "temp": 75.5 },
    "weather": [{ "description": "clear sky" }]
  }
}
```

**Headers:**
- `Cache-Control: max-age=600` (based on GITHUB_STATS_TTL_MS)

---

#### GET /api/github/stats

Returns GitHub repository and commit statistics.

**Query Parameters:**
- `force` (optional) - Set to `true` to bypass cache

**Response:**
```json
{
  "totalRepos": 45,
  "totalCommits": 1234,
  "cached": true
}
```

---

#### GET /api/weather

Proxies weather data from OpenWeatherMap.

**Query Parameters:**
- `lat` & `lon` - Coordinates (preferred)
- `q` - City name (fallback)

**Response:** Raw OpenWeatherMap API response

---

#### GET /api/leetcode/stats

Returns LeetCode problem-solving statistics.

**Response:**
```json
{
  "totalSolved": 150,
  "easySolved": 50,
  "mediumSolved": 70,
  "hardSolved": 30
}
```

---

#### GET /

Health check endpoint.

**Response:** `"Backend server is running!"`

---

## 7. Components Guide

### Intro Component

**File:** `frontend/src/components/Intro.tsx`

The hero section featuring:

- **Main Card** with parallax tilt effect (15° max angle)
- **Draggable Cards** (desktop only) for:
  - Personal photo
  - Latest update
  - Featured blog link
  - Fun fact
  - Pong game
  - Weather widget
  - LeetCode stats
  - GitHub stats
- **Social Links** - Email, LinkedIn, GitHub, Medium, X/Twitter
- **Scroll Indicator** - Bouncing "Scroll for More" text

**Desktop vs Mobile:**
- Desktop: Cards are draggable and scattered
- Mobile: Cards are stacked vertically

---

### Education & Experience Components

**Files:** `frontend/src/components/Education.tsx`, `Experience.tsx`

Both follow the same pattern:

- **Typewriter Effect** on section heading
- **Two-Column Layout** (desktop) - Cards alternate left/right
- **Single Column** (mobile) - Cards stack vertically
- **Modal Popups** - Click card to view full details
- **Framer Motion** - Slide-in animations from alternating sides

---

### Projects Component

**File:** `frontend/src/components/Projects.tsx`

- **Featured Projects** (first 6) in two-column layout
- **Other Projects** in separate section
- **Project Cards** with thumbnail, title, summary, and tags
- **Modal Details** - Full description, links, and technologies

---

### WeatherCard Component

**File:** `frontend/src/components/WeatherCard.tsx`

```typescript
function WeatherCard() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Get user's location via IP
    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        // Fetch weather for location
        return axios.get(`/api/weather?lat=${data.latitude}&lon=${data.longitude}`);
      })
      .then(res => setWeather(res.data))
      .catch(() => {
        // Fallback to Austin, TX
        axios.get('/api/weather?q=Austin').then(res => setWeather(res.data));
      });
  }, []);

  return (
    <GlassCard>
      <h3>{weather?.name}</h3>
      <p>{Math.round(weather?.main?.temp)}°F</p>
      <p>{weather?.weather?.[0]?.description}</p>
    </GlassCard>
  );
}
```

---

### LeetCodeStatsCard Component

**File:** `frontend/src/components/LeetCodeStatsCard.tsx`

Displays problem-solving statistics with sessionStorage caching.

---

### ScrollProgress Component

**File:** `frontend/src/components/ScrollProgress.tsx`

A thin progress bar at the top of the page:

```typescript
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId;
    let lastProgress = 0;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const newProgress = (scrollTop / docHeight) * 100;

      // Only update if change > 0.1%
      if (Math.abs(newProgress - lastProgress) > 0.1) {
        lastProgress = newProgress;
        setProgress(newProgress);
      }
      rafId = requestAnimationFrame(updateProgress);
    };

    rafId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[1.5px] bg-gradient-to-r from-blue-500 to-cyan-400 z-50"
      style={{ width: `${progress}%` }}
    />
  );
}
```

---

### SectionSidebar Component

**File:** `frontend/src/components/SectionSidebar.tsx`

Fixed navigation dots on the right side:

- **Auto-hides** after 2.2 seconds of inactivity
- **IntersectionObserver** detects active section
- **Smooth scroll** to section on click
- **Tooltips** on hover

---

### PongGame Component

**File:** `frontend/src/components/PongGame.tsx`

An interactive Pong game playable on the intro screen:

- **Controls:** Arrow keys or touch
- **Canvas-based** rendering
- **Responsive** sizing

---

### UI Components

#### GlassCard
**File:** `frontend/src/components/ui/GlassCard.tsx`

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function GlassCard({ children, className, onClick, style }: GlassCardProps) {
  return (
    <div
      className={`glass rounded-[15px] ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
```

#### GlassButton
```typescript
function GlassButton({ children, onClick, type = 'button', className }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`glass px-4 py-2 rounded-[15px] hover:scale-105 transition-transform ${className}`}
    >
      {children}
    </button>
  );
}
```

---

## 8. Styling System

### Design Tokens

#### Color Palette

```css
/* Primary Colors */
--primary: #3B82F6;        /* Blue */
--primary-dark: #2563EB;   /* Dark Blue */

/* Secondary Colors */
--secondary: #F43F5E;      /* Rose */
--secondary-dark: #E11D48; /* Dark Rose */

/* Tertiary Colors */
--tertiary: #10B981;       /* Emerald */

/* Glass Effect */
--glass-bg: rgba(255, 255, 255, 0.25);
--glass-border: rgba(255, 255, 255, 0.3);
```

#### Typography

```css
/* Fonts */
--font-heading: 'Playfair Display', serif;
--font-body: 'Inter', 'Poppins', sans-serif;
--font-mono: monospace;
```

### Global Styles

**File:** `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Animated Gradient Background */
body {
  background: linear-gradient(
    45deg,
    #1a1a2e,
    #16213e,
    #0f3460,
    #1a1a2e
  );
  background-size: 400% 400%;
  animation: gradientShift 12s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Custom Scrollbar (Hidden) */
::-webkit-scrollbar {
  display: none;
}

/* Premium Hover Overlay */
.premium-hover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.premium-hover:hover::before {
  opacity: 1;
}
```

### Tailwind Configuration

**File:** `frontend/tailwind.config.js`

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-dark': '#2563EB',
        secondary: '#F43F5E',
        'secondary-dark': '#E11D48',
        tertiary: '#10B981',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      borderRadius: {
        glass: '15px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
};
```

### Responsive Design

The site uses Tailwind's responsive prefixes:

| Breakpoint | Prefix | Min Width |
|------------|--------|-----------|
| Mobile | (default) | 0px |
| Small | `sm:` | 640px |
| Medium | `md:` | 768px |
| Large | `lg:` | 1024px |
| Extra Large | `xl:` | 1280px |

**Common Patterns:**
```html
<!-- Hidden on mobile, visible on medium+ -->
<div class="hidden md:block">...</div>

<!-- Single column mobile, two columns on large -->
<div class="grid grid-cols-1 lg:grid-cols-2">...</div>

<!-- Different padding by screen size -->
<div class="p-4 md:p-6 lg:p-8">...</div>
```

---

## 9. External Integrations

### GitHub API Integration

**Service File:** `backend/src/services/githubStatsService.ts`

**Endpoints Used:**
- `GET https://api.github.com/users/{username}/repos` - List repositories
- `GET https://api.github.com/repos/{owner}/{repo}/commits` - Commit count

**Authentication:**
```
Authorization: token {GITHUB_TOKEN}
```

**Features:**
- Fetches all repositories with pagination (100 per page)
- Counts total commits by parsing Link headers
- In-memory caching with 10-minute TTL
- Handles empty/inaccessible repositories gracefully

**Rate Limiting:**
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

---

### OpenWeatherMap Integration

**Controller:** `backend/src/controllers/weatherController.ts`

**Endpoint:**
```
GET https://api.openweathermap.org/data/2.5/weather
```

**Parameters:**
- `lat` & `lon` - Coordinates
- `q` - City name
- `units=imperial` - Temperature in Fahrenheit
- `appid` - API key

**Response Fields Used:**
- `name` - City name
- `main.temp` - Temperature
- `weather[0].description` - Weather description

---

### LeetCode Stats Integration

**Controller:** `backend/src/controllers/leetcodeController.ts`

**Endpoint:**
```
GET https://leetcode-stats-api.herokuapp.com/{username}
```

**Response Fields:**
- `totalSolved` - Total problems solved
- `easySolved` - Easy problems solved
- `mediumSolved` - Medium problems solved
- `hardSolved` - Hard problems solved

---

### Supabase Integration

**Client:** `frontend/src/lib/supabaseClient.ts`

**Tables:**

1. **weekly_task_templates**
   - `id` (UUID, PK)
   - `user_id` (UUID, FK)
   - `category` (text)
   - `text` (text)
   - `sort_order` (integer)
   - `active` (boolean)
   - `created_at` (timestamp)

2. **weekly_task_status**
   - `id` (UUID, PK)
   - `week_start` (date)
   - `task_id` (UUID, FK)
   - `completed` (boolean)
   - `proof_url` (text, nullable)
   - `note` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

3. **weekly_snapshots**
   - `week_start` (date, PK)
   - `user_id` (UUID)
   - `build_milestone` (text)
   - `best_demo_hook_url` (text)
   - `best_demo_walkthrough_url` (text)
   - `paid_work_progress` (text)
   - `traction_progress` (text)
   - `next_week_focus` (text)
   - `build_outcome` (text)
   - `internship_outcome` (text)
   - `traction_outcome` (text)

4. **pipeline_items**
   - `id` (UUID, PK)
   - `user_id` (UUID)
   - `type` (enum: internship, traction, relationship)
   - `name` (text)
   - `stage` (text)
   - `last_touch` (date)
   - `next_action` (text)
   - `next_action_date` (date)
   - `links` (text[])
   - `notes` (text)
   - `archived` (boolean)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

**Authentication:**
- Email/password authentication
- Row-level security (RLS) enabled
- Users can only access their own data

---

## 10. Configuration Files

### Frontend Configuration

#### package.json
```json
{
  "name": "personal-site-frontend",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

#### tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

#### tsconfig.app.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

#### Environment Variables

**.env.local (Development):**
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**.env.production:**
```
VITE_API_BASE_URL=https://your-backend.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### Backend Configuration

#### package.json
```json
{
  "name": "personal-site-backend",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ]
}
```

#### Environment Variables

**.env.example:**
```
PORT=5000
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_token_here
LEETCODE_USERNAME=your-leetcode-username
OPENWEATHER_API_KEY=your_api_key_here
GITHUB_STATS_TTL_MS=600000
```

---

## 11. Development Setup

### Prerequisites

- **Node.js** 18+ (or Bun 1.0+)
- **Git**
- **Code Editor** (VS Code recommended)

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/KushagraBharti/Personal-Site.git
cd Personal-Site
```

2. **Install dependencies:**

Using Bun (recommended):
```bash
# Frontend
cd frontend
bun install

# Backend
cd ../backend
bun install
```

Using npm:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. **Configure environment variables:**

Frontend (`frontend/.env.local`):
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

Backend (`backend/.env`):
```
PORT=5000
GITHUB_USERNAME=your_username
GITHUB_TOKEN=your_github_token
LEETCODE_USERNAME=your_leetcode_username
OPENWEATHER_API_KEY=your_openweather_key
```

4. **Start development servers:**

Terminal 1 (Backend):
```bash
cd backend
bun run dev
# Server starts at http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd frontend
bun run dev
# App starts at http://localhost:5173
```

5. **Open in browser:**
```
http://localhost:5173
```

### Getting API Keys

#### GitHub Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:user`
4. Copy token to `GITHUB_TOKEN`

#### OpenWeatherMap API Key
1. Create account at [openweathermap.org](https://openweathermap.org)
2. Go to API Keys section
3. Generate new key
4. Copy to `OPENWEATHER_API_KEY`

#### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy URL to `VITE_SUPABASE_URL`
4. Copy anon key to `VITE_SUPABASE_ANON_KEY`

---

## 12. Deployment Guide

### Vercel Deployment (Recommended)

#### Frontend Deployment

1. **Connect repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import Git repository
   - Select the `frontend` folder as root

2. **Configure build settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set environment variables:**
   - `VITE_API_BASE_URL` = your backend URL
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase key

4. **Deploy:**
   - Click Deploy
   - Wait for build to complete

#### Backend Deployment

1. **Build the project locally:**
```bash
cd backend
npm run build
```

2. **Connect to Vercel:**
   - Import repository
   - Select the `backend` folder as root

3. **Configure build settings:**
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Set environment variables:**
   - `GITHUB_USERNAME`
   - `GITHUB_TOKEN`
   - `LEETCODE_USERNAME`
   - `OPENWEATHER_API_KEY`
   - `GITHUB_STATS_TTL_MS`

5. **Ensure `vercel.json` is present:**
```json
{
  "version": 2,
  "builds": [
    { "src": "dist/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "dist/server.js" }
  ]
}
```

### Domain Configuration

1. Go to Vercel project settings
2. Add custom domain (e.g., `kushagrabharti.com`)
3. Configure DNS records as instructed
4. Enable HTTPS (automatic)

### Production Checklist

- [ ] Environment variables set correctly
- [ ] CORS whitelist includes production domains
- [ ] API keys are valid and have proper permissions
- [ ] Build completes without errors
- [ ] All endpoints return expected responses
- [ ] SSL/HTTPS is enabled
- [ ] Custom domain is configured

---

## 13. Data Models

### TypeScript Interfaces

#### Project
```typescript
interface Project {
  title: string;
  summary: string;
  description: string[];
  tags: string[];
  githubLink: string;
  thumbnail?: string;
}
```

#### Experience
```typescript
interface Experience {
  position: string;
  summary: string;
  description: string[];
  tags: string[];
  companyLink: string;
}
```

#### Education
```typescript
interface Education {
  dateRange: string;
  position: string;
  focus: string;
  description: string;
  schoolLink: string;
}
```

#### IntroData
```typescript
interface IntroData {
  personalPhoto: string;
  latestUpdate: string;
  funFact: string;
  featuredBlog: {
    title: string;
    link: string;
  };
  aiProjects: string[];
  travelPlans: string;
}
```

#### GitHubStats
```typescript
interface GitHubStats {
  totalRepos: number;
  totalCommits: number;
  cached?: boolean;
}
```

#### Weather
```typescript
interface Weather {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
}
```

#### LeetCodeStats
```typescript
interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}
```

### Tracker Types

**File:** `frontend/src/types/tracker.ts`

```typescript
interface TaskTemplate {
  id: string;
  user_id: string;
  category: string;
  text: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
}

interface TaskStatus {
  id: string;
  week_start: string;
  task_id: string;
  completed: boolean;
  proof_url?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

interface WeeklySnapshot {
  week_start: string;
  user_id: string;
  build_milestone?: string;
  best_demo_hook_url?: string;
  best_demo_walkthrough_url?: string;
  paid_work_progress?: string;
  traction_progress?: string;
  next_week_focus?: string;
  build_outcome?: string;
  internship_outcome?: string;
  traction_outcome?: string;
}

interface PipelineItem {
  id: string;
  user_id: string;
  type: 'internship' | 'traction' | 'relationship';
  name: string;
  stage: string;
  last_touch?: string;
  next_action: string;
  next_action_date?: string;
  links?: string[];
  notes?: string;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}
```

---

## 14. Performance Optimizations

### Code Splitting

React.lazy() is used for route-level code splitting:

```typescript
const Home = lazy(() => import('./pages/Home'));
const Tracker = lazy(() => import('./pages/Tracker'));
```

Each section component is also lazy-loaded:

```typescript
const Intro = lazy(() => import('../components/Intro'));
const About = lazy(() => import('../components/About'));
// etc.
```

### Caching Strategies

#### Frontend Caching

```typescript
// SessionStorage caching for API responses
const cached = sessionStorage.getItem('projects');
if (cached) {
  return JSON.parse(cached);
}

// Fetch and cache
const response = await axios.get('/api/projects');
sessionStorage.setItem('projects', JSON.stringify(response.data));
```

#### Backend Caching

```typescript
// In-memory cache for GitHub stats
let cache = { data: null, timestamp: 0 };
const TTL = 600000; // 10 minutes

if (cache.data && Date.now() - cache.timestamp < TTL) {
  return { ...cache.data, cached: true };
}
```

#### HTTP Caching

```typescript
// Cache-Control headers
res.set('Cache-Control', `max-age=${TTL_SECONDS}`);
```

### Image Optimization

```jsx
<img
  src="/SelfPic.jpg"
  alt="Profile"
  loading="lazy"
  decoding="async"
/>
```

### Event Optimization

```typescript
// RequestAnimationFrame for scroll handling
useEffect(() => {
  let rafId;
  const handleScroll = () => {
    rafId = requestAnimationFrame(() => {
      // Update state only when necessary
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

### Prefetching

```typescript
// Prefetch during idle time
useEffect(() => {
  requestIdleCallback(() => {
    // Preload components
    import('../components/About');
    import('../components/Education');
  });
}, []);
```

---

## 15. Security Considerations

### CORS Configuration

The backend implements strict CORS with a whitelist approach:

```typescript
// Only allow specific origins
const allowedOrigins = [
  'https://www.kushagrabharti.com',
  'https://kushagrabharti.com',
  // Development origins only in non-production
];

// Validate with regex for dynamic Vercel URLs
const dynamicPatterns = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
];
```

### Environment Variables

- **Never commit secrets** - `.env` files are gitignored
- **Use `.env.example`** - Template without actual values
- **Separate environments** - Different keys for dev/prod

### API Key Protection

- GitHub token stored server-side only
- Weather API key proxied through backend
- Supabase anon key is safe for client-side (with RLS)

### Supabase Row-Level Security

```sql
-- Users can only access their own data
CREATE POLICY "Users can only see own tasks"
  ON weekly_task_templates
  FOR ALL
  USING (auth.uid() = user_id);
```

### Input Validation

```typescript
// Validate numeric IDs
const id = parseInt(req.params.id);
if (isNaN(id) || id < 0 || id >= data.length) {
  return res.status(404).json({ error: 'Not found' });
}
```

### HTTPS Only

Production deployment enforces HTTPS via Vercel.

---

## 16. Troubleshooting

### Common Issues

#### CORS Errors

**Problem:** `Access-Control-Allow-Origin` errors in browser console

**Solutions:**
1. Verify your origin is in the whitelist (`backend/src/app.ts`)
2. Check that you're using the correct API URL
3. Ensure backend is running and accessible

#### GitHub Stats Not Loading

**Problem:** GitHub stats show as null or error

**Solutions:**
1. Verify `GITHUB_TOKEN` is valid and not expired
2. Check token has `repo` and `read:user` scopes
3. Try force refresh: `/api/github/stats?force=true`

#### Weather Not Displaying

**Problem:** Weather card shows error or loading forever

**Solutions:**
1. Verify `OPENWEATHER_API_KEY` is valid
2. Check browser allows location access
3. Test fallback city: `/api/weather?q=Austin`

#### Build Failures

**Problem:** TypeScript or Vite build errors

**Solutions:**
1. Delete `node_modules` and reinstall
2. Check TypeScript version compatibility
3. Run `npm run lint` to find issues

#### Supabase Connection Issues

**Problem:** Tracker page shows auth or data errors

**Solutions:**
1. Verify Supabase URL and anon key are correct
2. Check RLS policies are properly configured
3. Ensure tables exist with correct schemas

### Debug Commands

```bash
# Check backend health
curl http://localhost:5000/

# Test specific endpoint
curl http://localhost:5000/api/projects

# Check GitHub stats with verbose output
curl -v http://localhost:5000/api/github/stats

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.GITHUB_USERNAME)"
```

### Logging

Add debug logging in development:

```typescript
// Backend
console.log('Fetching GitHub stats...', { username: GITHUB_USERNAME });

// Frontend
console.log('API response:', response.data);
```

---

## Additional Resources

### Documentation Links

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Express.js](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Project Links

- **Live Site:** [https://www.kushagrabharti.com](https://www.kushagrabharti.com)
- **GitHub:** [https://github.com/KushagraBharti/Personal-Site](https://github.com/KushagraBharti/Personal-Site)

---

## Changelog

| Date | Changes |
|------|---------|
| Latest | Migration to Bun package manager |
| Latest | Backend info updates |
| Latest | Bug fixes and cleanup |

---

*This documentation was generated to provide a complete technical reference for the Personal Portfolio Website repository. For questions or contributions, please open an issue on GitHub.*
