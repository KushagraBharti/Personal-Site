// frontend/src/components/Intro.tsx
import React, { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Tilt from "react-parallax-tilt";
import Draggable from "react-draggable";
import GlassCard from "./ui/GlassCard";
import GlassButton from "./ui/GlassButton";
import { FaEnvelope, FaMediumM, FaGithub, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiClaude, SiGooglegemini, SiOpenai } from "react-icons/si";
import selfPic from "/SelfPic.jpg";
import {
  buildAiSummaryPrompt,
  SummaryEducationEntry,
  SummaryExperienceEntry,
  SummaryProjectEntry,
} from "../lib/buildAiSummaryPrompt";

const WeatherCard = React.lazy(() => import("./WeatherCard"));
const PongGame = React.lazy(() => import("./PongGame"));

const sanitizeLatestUpdate = (latestUpdate: string) =>
  latestUpdate
    .replace(/\band leetcoding\b!?/gi, "")
    .replace(/\bleetcoding\b!?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

interface IntroResponse {
  personalPhoto: string;
  githubStats: { totalRepos: number; totalCommits: number } | null;
  weather: { city: string; temp: number; description: string } | null;
  latestUpdate: string;
  funFact: string;
  featuredBlog: { title: string; link: string };
  aiProjects: string[];
  travelPlans: string;
}

const BASIC_INFO = {
  name: "Kushagra Bharti",
  headline: "Student | Software Engineer | ML Enthusiast",
  personalSummary: "I am an aspiring founder, but right now I am focused on building my skills and learning.",
};

const AI_DESTINATIONS = [
  {
    label: "ChatGPT",
    Icon: SiOpenai,
    buildHref: (query: string) => `https://chat.openai.com/?q=${encodeURIComponent(query)}`,
  },
  {
    label: "Claude",
    Icon: SiClaude,
    buildHref: (query: string) => `https://claude.ai/new?q=${encodeURIComponent(query)}`,
  },
  {
    label: "Google AI",
    Icon: SiGooglegemini,
    buildHref: (query: string) =>
      `https://www.google.com/search?udm=50&source=searchlabs&q=${encodeURIComponent(query)}`,
  },
];

// Fallback default data for instant load
const defaultIntroData: IntroResponse = {
  personalPhoto: "placeholder.svg",
  githubStats: null,
  weather: null,
  latestUpdate: "Currently applying for Summer 2026 internships.",
  funFact: "A film I made was screened at AMC Theatres in Times Square!",
  featuredBlog: {
    title: "The Trillion Dollar AI Software Development Stack",
    link: "https://a16z.com/the-trillion-dollar-ai-software-development-stack/",
  },
  aiProjects: ["Placeholder project"],
  travelPlans: "No travel plans yet",
};

const buildFallbackSummaryPrompt = () =>
  buildAiSummaryPrompt({
    basicInfo: BASIC_INFO,
    intro: defaultIntroData,
    education: [],
    experiences: [],
    featuredProjects: [],
    additionalProjects: [],
  });

const AiSummaryLaunchBar: React.FC<{ prompt: string }> = ({ prompt }) => (
  <div className="ai-summary-strip">
    <p className="ai-summary-strip__label">Request an AI summary of me</p>
    <div className="ai-summary-strip__icons" aria-label="AI summary destinations">
      {AI_DESTINATIONS.map(({ label, Icon, buildHref }) => (
        <a
          key={label}
          href={buildHref(prompt)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${label} with a prefilled AI summary prompt`}
          title={label}
          className="ai-summary-strip__link"
        >
          <Icon size={24} />
        </a>
      ))}
    </div>
  </div>
);

const Intro: React.FC = () => {
  const [introData, setIntroData] = useState<IntroResponse>(defaultIntroData);
  const [isAtTop, setIsAtTop] = useState(true);
  const [summaryPrompt, setSummaryPrompt] = useState<string>(() => buildFallbackSummaryPrompt());
  const MiniCardLoader = ({ title }: { title: string }) => (
    <GlassCard className="p-4 w-60 text-center animate-pulse">
      <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-200">Loading...</p>
    </GlassCard>
  );

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
      /\/$/,
      ""
    );
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await axios.get<IntroResponse>(`${apiBase}/api/intro`, {
          signal: controller.signal,
        });
        setIntroData({
          ...res.data,
          latestUpdate: sanitizeLatestUpdate(res.data.latestUpdate),
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching intro data:", error);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const data = introData;

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
      /\/$/,
      ""
    );
    const controller = new AbortController();

    const loadSummaryPrompt = async () => {
      try {
        const [educationResponse, experiencesResponse, projectsResponse] = await Promise.all([
          axios.get<SummaryEducationEntry[]>(`${apiBase}/api/education`, {
            signal: controller.signal,
          }),
          axios.get<SummaryExperienceEntry[]>(`${apiBase}/api/experiences`, {
            signal: controller.signal,
          }),
          axios.get<SummaryProjectEntry[]>(`${apiBase}/api/projects`, {
            signal: controller.signal,
          }),
        ]);

        const projects = projectsResponse.data;
        const prompt = buildAiSummaryPrompt({
          basicInfo: BASIC_INFO,
          intro: data,
          education: educationResponse.data,
          experiences: experiencesResponse.data,
          featuredProjects: projects.slice(0, 6),
          additionalProjects: projects.slice(6),
        });

        if (!controller.signal.aborted) {
          setSummaryPrompt(prompt);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error building AI summary prompt:", error);
        }
      }
    };

    loadSummaryPrompt();

    return () => {
      controller.abort();
    };
  }, [data]);

  return (
    <section className="full-screen-bg intro-stage relative overflow-hidden">
      {/* Main central card – always rendered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Tilt
          tiltMaxAngleX={15}
          tiltMaxAngleY={15}
          perspective={800}
          scale={1.05}
          transitionSpeed={2500}
          className="max-w-2xl mx-auto"
        >
          <GlassCard className="flex flex-col items-center text-center p-10 hidden md:block">
            <h1 className="text-5xl md:text-6xl font-playfair mb-4">
              Kushagra Bharti
            </h1>
            <p className="text-lg font-mono mb-6">
              Student | Software Engineer | ML Enthusiast
            </p>
            <div className="flex justify-center space-x-6 mb-6">
              <a
                href="mailto:kushagrabharti@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#D44638]"
                aria-label="Email Kushagra"
              >
                <FaEnvelope size={24} />
              </a>
              <a
                href="https://www.linkedin.com/in/kushagra-bharti/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#0A66C2]"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={24} />
              </a>
              <a
                href="https://github.com/kushagrabharti"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#6e40c9]"
                aria-label="GitHub"
              >
                <FaGithub size={24} />
              </a>
              <a
                href="https://medium.com/@kushagrabharti"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#00ab6c]"
                aria-label="Medium"
              >
                <FaMediumM size={24} />
              </a>
              <a
                href="https://x.com/IamKushagraB"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-black"
                aria-label="X (Twitter)"
              >
                <FaXTwitter size={24} />
              </a>
            </div>
            <div className="mb-6">
              <AiSummaryLaunchBar prompt={summaryPrompt} />
            </div>
            <GlassButton
              onClick={() =>
                window.scrollTo({
                  top: window.innerHeight,
                  behavior: "smooth",
                })
              }
            >
              Explore
            </GlassButton>
          </GlassCard>
        </Tilt>
      </div>

      {/* --- Interactive Layout for Medium and Larger Screens --- */}
      <div className="hidden md:block">
        {/* Draggable Cards in desired order */}
        {/* Photo Card */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--photo cursor-grab active:cursor-grabbing">
            <GlassCard className="p-2 w-60 text-center flex flex-col items-center">
              <img
                src={selfPic}
                alt="Personal"
                className="rounded-lg object-cover w-60 h-64"
                decoding="async"
              />
              <p className="text-sm text-gray-200 mt-3">Drag Me Around!</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* Latest Update */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--latest cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Latest Update</h4>
              <p className="text-sm text-gray-200">{data.latestUpdate}</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* My Recent Read */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--read cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-60 text-center">
              <h4 className="text-sm font-bold text-white mb-1">My Recent Read</h4>
              <a
                href={data.featuredBlog.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-200 hover:text-[#0A66C2]"
              >
                {data.featuredBlog.title}
              </a>
            </GlassCard>
          </div>
        </Draggable>

        {/* Fun Fact */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--fact cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Fun Fact</h4>
              <p className="text-sm text-gray-200">{data.funFact}</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* Pong Game */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--pong cursor-grab active:cursor-grabbing">
            <GlassCard className="flex flex-col items-center p-8">
              <Suspense fallback={<div className="h-[180px] w-[275px] animate-pulse bg-black/30 rounded" />}>
                <PongGame />
              </Suspense>
            </GlassCard>
          </div>
        </Draggable>

        {/* Weather Card */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--weather cursor-grab active:cursor-grabbing">
            <Suspense fallback={<MiniCardLoader title="Weather" />}>
              <WeatherCard />
            </Suspense>
          </div>
        </Draggable>

        {/* GitHub Stats Card */}
        <Draggable bounds="parent">
          <div className="floating-card floating-card--github cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-60 text-center">
              <h4 className="text-sm font-bold text-white mb-1">
                Live GitHub Stats
              </h4>
              {data.githubStats ? (
                <p className="text-sm text-gray-200">
                  <strong>Repositories:</strong> {data.githubStats.totalRepos ?? "N/A"}
                  <br />
                  <strong>Total Commits:</strong> {data.githubStats.totalCommits ?? "N/A"}
                </p>
              ) : (
                <p className="text-sm text-gray-200">GitHub stats loading...</p>
              )}
            </GlassCard>
          </div>
        </Draggable>
      </div>

      {/* --- Static Mobile Layout for Small Screens --- */}
      <div className="block md:hidden p-4 space-y-4">
        <GlassCard className="w-full text-center">
          <Tilt
            tiltMaxAngleX={15}
            tiltMaxAngleY={15}
            perspective={800}
            scale={1.05}
            transitionSpeed={2500}
            className="mx-auto max-w-2xl"
          >
            <GlassCard className="flex flex-col items-center text-center p-10">
              <h1 className="text-5xl font-playfair mb-4">
                Kushagra Bharti
              </h1>
              <p className="text-lg font-mono mb-6">
                Student | Software Engineer | ML Enthusiast
              </p>
              <div className="flex justify-center space-x-6 mb-6">
                <a
                  href="mailto:kushagrabharti@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-300 hover:scale-110 hover:text-[#D44638]"
                  aria-label="Email Kushagra"
                >
                  <FaEnvelope size={24} />
                </a>
                <a
                  href="https://www.linkedin.com/in/kushagra-bharti/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-300 hover:scale-110 hover:text-[#0A66C2]"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={24} />
                </a>
                <a
                  href="https://github.com/kushagrabharti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-300 hover:scale-110 hover:text-[#6e40c9]"
                  aria-label="GitHub"
                >
                  <FaGithub size={24} />
                </a>
                <a
                  href="https://medium.com/@kushagrabharti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-300 hover:scale-110 hover:text-[#00ab6c]"
                  aria-label="Medium"
                >
                  <FaMediumM size={24} />
                </a>
                <a
                  href="https://x.com/IamKushagraB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-300 hover:scale-110 hover:text-[#1D9BF0]"
                  aria-label="X (Twitter)"
                >
                  <FaXTwitter size={24} />
                </a>
              </div>
              <div className="mb-6">
                <AiSummaryLaunchBar prompt={summaryPrompt} />
              </div>
              <GlassButton
                onClick={() =>
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: "smooth",
                  })
                }
              >
                Explore
              </GlassButton>
            </GlassCard>
          </Tilt>
        </GlassCard>

        {/* Stacked mini-cards */}
        <GlassCard className="w-full text-center p-4">
          <h4 className="text-sm font-bold text-white mb-1">Latest Update</h4>
          <p className="text-sm text-gray-200">{data.latestUpdate}</p>
        </GlassCard>
        <GlassCard className="w-full text-center p-4">
          <h4 className="text-sm font-bold text-white mb-1">My Recent Read</h4>
          <a
            href={data.featuredBlog.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-200 hover:text-[#0A66C2]"
          >
            {data.featuredBlog.title}
          </a>
        </GlassCard>
        <GlassCard className="w-full text-center p-4">
          <h4 className="text-sm font-bold text-white mb-1">Fun Fact</h4>
          <p className="text-sm text-gray-200">{data.funFact}</p>
        </GlassCard>
        <GlassCard className="w-full text-center p-4">
          <h4 className="text-sm font-bold text-white mb-1">Live GitHub Stats</h4>
          {data.githubStats ? (
            <p className="text-sm text-gray-200">
              <strong>Repositories:</strong> {data.githubStats.totalRepos ?? "N/A"}
              <br />
              <strong>Total Commits:</strong> {data.githubStats.totalCommits ?? "N/A"}
            </p>
          ) : (
            <p className="text-sm text-red-300">GitHub stats unavailable</p>
          )}
        </GlassCard>
      </div>

      {/* "Scroll for More" indicator – only visible when at the top */}
      {isAtTop && (
        <div className="fixed bottom-4 w-full flex justify-center z-50 pointer-events-none">
          <p className="text-sm text-white/80 animate-bounce pointer-events-auto">
            Scroll for More
          </p>
        </div>
      )}
    </section>
  );
};

export default Intro;
