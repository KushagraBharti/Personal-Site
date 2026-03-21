// frontend/src/components/Intro.tsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import Tilt from "react-parallax-tilt";
import Draggable from "react-draggable";
import GlassCard from "./ui/GlassCard";
import GlassButton from "./ui/GlassButton";
import { FaEnvelope, FaMediumM, FaGithub, FaLinkedin } from "react-icons/fa";
import { FaCheck, FaCopy, FaWandSparkles, FaXTwitter } from "react-icons/fa6";
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
  { label: "ChatGPT", href: "https://chatgpt.com/" },
  { label: "Claude", href: "https://claude.ai/" },
  { label: "Gemini", href: "https://gemini.google.com/" },
  { label: "Perplexity", href: "https://www.perplexity.ai/" },
  { label: "Grok", href: "https://grok.com/" },
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

const Intro: React.FC = () => {
  const [introData, setIntroData] = useState<IntroResponse>(defaultIntroData);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done">("idle");
  const summaryDialogRef = useRef<HTMLDialogElement | null>(null);
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
    const dialog = summaryDialogRef.current;
    if (!dialog) {
      return;
    }

    if (isSummaryOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isSummaryOpen && dialog.open) {
      dialog.close();
    }
  }, [isSummaryOpen]);

  useEffect(() => {
    if (!isSummaryOpen) {
      return;
    }

    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
      /\/$/,
      ""
    );
    const controller = new AbortController();

    const loadSummaryPrompt = async () => {
      setIsSummaryLoading(true);
      setSummaryError(null);

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

        setSummaryPrompt(prompt);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error building AI summary prompt:", error);
          setSummaryError("Unable to build the live summary prompt right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      }
    };

    loadSummaryPrompt();

    return () => {
      controller.abort();
    };
  }, [data, isSummaryOpen]);

  useEffect(() => {
    if (copyState !== "done") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const handleCopyPrompt = async () => {
    if (!summaryPrompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryPrompt);
      setCopyState("done");
    } catch (error) {
      console.error("Failed to copy AI summary prompt:", error);
      setSummaryError("Copy failed. You can still select the prompt manually.");
    }
  };

  const handleOpenAiDestination = async (href: string) => {
    if (summaryPrompt) {
      try {
        await navigator.clipboard.writeText(summaryPrompt);
        setCopyState("done");
      } catch (error) {
        console.error("Failed to copy AI summary prompt before redirect:", error);
      }
    }

    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="full-screen-bg relative overflow-hidden">
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
            <div className="mb-6 flex w-full max-w-md flex-col items-center">
              <GlassButton
                onClick={() => setIsSummaryOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isSummaryOpen}
                aria-controls="ai-summary-dialog"
                className="inline-flex items-center gap-2 px-5 py-3"
              >
                <FaWandSparkles size={16} />
                AI Summary of Me
              </GlassButton>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
                Live prompt generated from portfolio data
              </p>
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
        <Draggable>
          <div className="absolute top-24 left-96 cursor-grab active:cursor-grabbing">
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
        <Draggable>
          <div className="absolute top-[68%] left-[45%] cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Latest Update</h4>
              <p className="text-sm text-gray-200">{data.latestUpdate}</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* My Recent Read */}
        <Draggable>
          <div className="absolute top-[5%] left-[55%] cursor-grab active:cursor-grabbing">
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
        <Draggable>
          <div className="absolute top-[47%] left-[82%] cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Fun Fact</h4>
              <p className="text-sm text-gray-200">{data.funFact}</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* Pong Game */}
        <Draggable>
          <div className="absolute top-[75%] left-[70%] cursor-grab active:cursor-grabbing">
            <GlassCard className="flex flex-col items-center p-8">
              <Suspense fallback={<div className="h-[180px] w-[275px] animate-pulse bg-black/30 rounded" />}>
                <PongGame />
              </Suspense>
            </GlassCard>
          </div>
        </Draggable>

        {/* Weather Card */}
        <Draggable>
          <div className="absolute top-[15%] left-[80%] cursor-grab active:cursor-grabbing">
            <Suspense fallback={<MiniCardLoader title="Weather" />}>
              <WeatherCard />
            </Suspense>
          </div>
        </Draggable>

        {/* GitHub Stats Card */}
        <Draggable>
          <div className="absolute top-[45%] left-[10%] cursor-grab active:cursor-grabbing">
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
              <div className="mb-6 flex w-full max-w-md flex-col items-center">
                <GlassButton
                  onClick={() => setIsSummaryOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isSummaryOpen}
                  aria-controls="ai-summary-dialog"
                  className="inline-flex items-center gap-2 px-5 py-3"
                >
                  <FaWandSparkles size={16} />
                  Open AI Summary
                </GlassButton>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
                  Live prompt generated from portfolio data
                </p>
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

      <dialog
        ref={summaryDialogRef}
        id="ai-summary-dialog"
        className="ai-summary-dialog"
        aria-labelledby="ai-summary-title"
        aria-describedby="ai-summary-desc"
        onClose={() => setIsSummaryOpen(false)}
        onCancel={(event) => {
          event.preventDefault();
          setIsSummaryOpen(false);
        }}
      >
        <div
          className="flex min-h-full items-center justify-center bg-black/50 p-4 md:p-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsSummaryOpen(false);
            }
          }}
        >
          <GlassCard className="modal-glass-card relative w-full max-w-2xl p-6 text-left md:p-8">
            <button
              className="absolute right-4 top-4 text-2xl text-gray-200 transition-colors hover:text-white"
              onClick={() => setIsSummaryOpen(false)}
              aria-label="Close AI summary"
              type="button"
            >
              ×
            </button>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-100/70">
              AI Summary
            </p>
            <h2
              id="ai-summary-title"
              className="mt-2 text-3xl font-playfair text-white md:text-4xl"
            >
              Request an AI summary of Kushagra
            </h2>
            <p
              id="ai-summary-desc"
              className="mt-4 text-base leading-7 text-gray-100 md:text-lg"
            >
              This prompt is generated from your live portfolio content, so updates to education,
              experience, intro data, or projects flow into the next summary request automatically.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Education</p>
                <p className="mt-2 text-sm text-white">Pulled from your live education section</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Experience</p>
                <p className="mt-2 text-sm text-white">Includes all work, research, and leadership entries</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Projects</p>
                <p className="mt-2 text-sm text-white">Includes featured projects plus the rest of the portfolio</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {AI_DESTINATIONS.map((destination) => (
                <button
                  key={destination.label}
                  type="button"
                  onClick={() => void handleOpenAiDestination(destination.href)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/85 transition-colors hover:bg-white/20"
                >
                  {destination.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <GlassButton
                type="button"
                onClick={() => void handleCopyPrompt()}
                className="inline-flex items-center gap-2 px-4 py-2"
              >
                {copyState === "done" ? <FaCheck size={14} /> : <FaCopy size={14} />}
                {copyState === "done" ? "Copied" : "Copy prompt"}
              </GlassButton>
              <p className="text-sm text-white/70">
                Open any AI app above. The prompt is copied before the tab opens.
              </p>
            </div>
            {summaryError ? (
              <p className="mt-4 text-sm text-red-200">{summaryError}</p>
            ) : null}
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">
                  Generated Prompt
                </p>
                {isSummaryLoading ? (
                  <p className="text-xs uppercase tracking-[0.28em] text-white/40">Loading...</p>
                ) : null}
              </div>
              <textarea
                readOnly
                value={
                  isSummaryLoading
                    ? "Building a fresh prompt from your current portfolio content..."
                    : summaryPrompt
                }
                className="min-h-[320px] w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
              />
            </div>
          </GlassCard>
        </div>
      </dialog>

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
