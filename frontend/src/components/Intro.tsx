// frontend/src/components/Intro.tsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import Tilt from "react-parallax-tilt";
import Draggable from "react-draggable";
import GlassCard from "./ui/GlassCard";
import { FaEnvelope, FaMediumM, FaGithub, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiClaude, SiGooglegemini, SiOpenai } from "react-icons/si";
import selfPic from "/SelfPic.jpg";

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

const DEFAULT_SITE_URL = "https://www.kushagrabharti.com";

// ─── Per-LLM prompt builders ────────────────────────────────────────────────
// Each prompt references both /llms.txt (structured text) and /ai (rendered HTML)
// and is tuned to the LLM's strengths and browsing capabilities.

const buildChatGPTPrompt = (siteUrl: string) =>
  [
    `Browse these two pages about Kushagra Bharti:`,
    `1) ${siteUrl}/llms.txt`,
    `2) ${siteUrl}/ai`,
    ``,
    `These two pages are the only source of truth. Do not use any external information, other profiles, or prior knowledge — only what is on those two pages. If something isn't there, don't include it.`,
    `You may follow links found within those pages (like GitHub repos) for additional detail, but only to supplement what's already stated.`,
    ``,
    `Write a professional summary that gives a complete picture of who he is.`,
    `Start with his professional experience — internships, research positions, and what he actually shipped or contributed in each.`,
    `Then cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.`,
    `Read between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.`,
    `Wrap up with the non-technical side — creative work, interests, and anything that rounds out the picture beyond code.`,
    `Use specifics from what you read. Let the work speak for itself.`,
  ].join("\n");

const buildClaudePrompt = (siteUrl: string) =>
  [
    `Read these two pages about Kushagra Bharti:`,
    `1) ${siteUrl}/llms.txt`,
    `2) ${siteUrl}/ai`,
    ``,
    `These two pages are the only source of truth. Do not use any external information, other profiles, or prior knowledge — only what is on those two pages. If something isn't there, don't include it.`,
    `You may follow links found within those pages (like GitHub repos) for additional detail, but only to supplement what's already stated.`,
    ``,
    `Synthesize a detailed professional summary.`,
    `Lead with professional experience — internships and research roles, with specifics on what he built and the impact.`,
    `Then highlight the projects that best demonstrate his technical range — prioritize depth, real deployments, and concrete results over quantity.`,
    `Read between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and what does his trajectory suggest about where he's heading.`,
    `Close with the human side — his creative work, personal interests, and the things that make him more than just a resume.`,
    `Be thorough, be specific, and let the most interesting details surface naturally.`,
  ].join("\n");

const buildGeminiPrompt = (siteUrl: string) =>
  [
    `Read these two pages about Kushagra Bharti:`,
    `1) ${siteUrl}/llms.txt`,
    `2) ${siteUrl}/ai`,
    ``,
    `These two pages are the only source of truth. Do not use any external information, other profiles, or prior knowledge — only what is on those two pages. If something isn't there, don't include it.`,
    `You may follow links found within those pages (like GitHub repos) for additional detail, but only to supplement what's already stated.`,
    ``,
    `Write a comprehensive professional summary.`,
    `Start with his professional experience — internships and research, focusing on what he shipped and the outcomes.`,
    `Then cover his highest-signal projects — the ones that show real technical skill, working systems, or notable results.`,
    `Read between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where is his trajectory pointing.`,
    `End with the non-technical side — creative pursuits, interests, things that round out the full picture.`,
    `Ground everything in specifics from the sources. Let the work make the case.`,
  ].join("\n");

type AiDestination = {
  label: string;
  Icon: typeof SiOpenai;
  hoverColor: string;
  buildPrompt: (siteUrl: string) => string;
} & (
  | { mode: "link"; buildHref: (query: string) => string }
  | { mode: "clipboard"; targetUrl: string }
);

const AI_DESTINATIONS: AiDestination[] = [
  {
    label: "ChatGPT",
    Icon: SiOpenai,
    hoverColor: "hover:text-[#10a37f]",
    mode: "link",
    buildPrompt: buildChatGPTPrompt,
    buildHref: (query: string) => `https://chat.openai.com/?q=${encodeURIComponent(query)}`,
  },
  {
    label: "Claude",
    Icon: SiClaude,
    hoverColor: "hover:text-[#da7756]",
    mode: "link",
    buildPrompt: buildClaudePrompt,
    buildHref: (query: string) => `https://claude.ai/new?q=${encodeURIComponent(query)}`,
  },
  {
    label: "Gemini",
    Icon: SiGooglegemini,
    hoverColor: "hover:text-[#4285f4]",
    mode: "clipboard",
    buildPrompt: buildGeminiPrompt,
    targetUrl: "https://gemini.google.com/app",
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

type DesktopCardKey = "photo" | "github" | "read" | "weather" | "fact" | "latest" | "pong";

type CardPosition = {
  x: number;
  y: number;
};

type DesktopStageLayout = {
  stageHeight: number;
  stageWidth: number;
  hero: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  cards: Record<DesktopCardKey, CardPosition>;
};

const DESKTOP_CARD_BASE_LAYER: Record<DesktopCardKey, number> = {
  photo: 8,
  github: 7,
  read: 6,
  weather: 5,
  fact: 4,
  latest: 3,
  pong: 2,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/*
 * Card positions are computed relative to the centered hero card.
 *
 * Instead of fixed ratios that break at different sizes, each card is placed
 * as a proportional offset into the available space around the hero:
 *
 *      L = space left of hero     R = space right of hero
 *      T = space above hero       B = space below hero
 *
 * This means the constellation naturally spreads on large monitors and
 * tightens on smaller ones — no per-breakpoint tuning needed.
 *
 * Conceptual layout (clockwise from top-left):
 *
 *    [photo]               [read]       [weather]
 *
 *               ┌──────────────┐
 *               │              │         [fact]
 *               │    HERO      │
 *               │              │
 *               └──────────────┘
 *    [github]        [latest]       [pong]
 */
const getDesktopStageLayout = (
  viewportWidth: number,
  viewportHeight: number
): DesktopStageLayout => {
  const stageWidth = Math.max(viewportWidth - 48, 1180);
  const stageHeight = Math.max(viewportHeight - 64, 700);

  // Hero scales with viewport width
  let heroWidth: number;
  if (stageWidth >= 1650) heroWidth = 560;
  else if (stageWidth >= 1480) heroWidth = 530;
  else if (stageWidth >= 1260) heroWidth = 510;
  else heroWidth = 480;

  const heroHeight = 360;

  // Center the hero; nudge up slightly so the "Scroll for More" text
  // at the bottom doesn't make it feel too low.
  const heroX = Math.round((stageWidth - heroWidth) / 2);
  const heroY = Math.round((stageHeight - heroHeight) / 2) - 20;

  // Available space from hero edges to stage edges
  const L = heroX;
  const R = stageWidth - heroX - heroWidth;
  const T = heroY;
  const B = stageHeight - heroY - heroHeight;

  const E = 16; // minimum stage-edge inset

  // ─── Card positions ────────────────────────────────────────────────
  //
  // Layout (matching the designer-approved reference):
  //
  //   [photo]        [read]              [weather]
  //   (upper-left)   (above hero)        (right, upper)
  //
  //                  ┌──────────┐
  //                  │   HERO   │        [fact]
  //                  └──────────┘        (right, lower)
  //
  //   [github]                     [pong]
  //   (left, lower)                (below-right)
  //
  //                  [latest]
  //                  (below, center-left)

  const cards = {
    // ▸ PHOTO (≈240 × 300) — upper-left, well offset from hero
    photo: {
      x: clamp(Math.round(L * 0.28), E, heroX - 260),
      y: clamp(Math.round(T * 0.12), E, heroY - 40),
    },

    // ▸ READ (≈240 × 110) — above the hero, near hero's horizontal center
    read: {
      x: clamp(Math.round(heroX + heroWidth * 0.30), E, stageWidth - 252),
      y: clamp(Math.round(T * 0.10), E, heroY - 30),
    },

    // ▸ WEATHER (≈240 × 110) — right side, slightly above hero level
    weather: {
      x: clamp(Math.round(heroX + heroWidth + R * 0.42), heroX + heroWidth + 20, stageWidth - 252),
      y: clamp(Math.round(heroY - T * 0.10), E, stageHeight - 120),
    },

    // ▸ FACT (≈260 × 130) — right side, below weather
    fact: {
      x: clamp(Math.round(heroX + heroWidth + R * 0.48), heroX + heroWidth + 20, stageWidth - 272),
      y: clamp(Math.round(heroY + heroHeight * 0.50), heroY + 60, stageHeight - 140),
    },

    // ▸ GITHUB (≈240 × 110) — left side, below hero
    github: {
      x: clamp(Math.round(L * 0.22), E, heroX - 200),
      y: clamp(Math.round(heroY + heroHeight + B * 0.18), heroY + heroHeight * 0.65, stageHeight - 120),
    },

    // ▸ LATEST (≈260 × 130) — below hero, slightly left of center
    latest: {
      x: clamp(Math.round(heroX + heroWidth * 0.06), E, stageWidth - 272),
      y: clamp(Math.round(heroY + heroHeight + B * 0.52), heroY + heroHeight + 20, stageHeight - 140),
    },

    // ▸ PONG (≈340 × 280) — below-right of hero
    pong: {
      x: clamp(Math.round(heroX + heroWidth + R * 0.08), heroX + heroWidth - 80, stageWidth - 352),
      y: clamp(Math.round(heroY + heroHeight + B * 0.12), heroY + heroHeight - 80, stageHeight - 292),
    },
  } satisfies Record<DesktopCardKey, CardPosition>;

  return {
    stageWidth,
    stageHeight,
    hero: { width: heroWidth, height: heroHeight, x: heroX, y: heroY },
    cards,
  };
};

const DesktopDraggableCard: React.FC<{
  cardKey: DesktopCardKey;
  defaultPosition: CardPosition;
  layer: number;
  onLift: (cardKey: DesktopCardKey) => void;
  children: React.ReactNode;
}> = ({ cardKey, defaultPosition, layer, onLift, children }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      bounds="parent"
      cancel="a, button"
      defaultPosition={defaultPosition}
      nodeRef={nodeRef}
      onStart={() => onLift(cardKey)}
    >
      <div
        ref={nodeRef}
        className="floating-card cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none", zIndex: layer }}
      >
        <div className="floating-card__surface">{children}</div>
      </div>
    </Draggable>
  );
};

const Intro: React.FC = () => {
  const [introData, setIntroData] = useState<IntroResponse>(defaultIntroData);
  const [isAtTop, setIsAtTop] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900
  );
  const [cardLayers, setCardLayers] =
    useState<Record<DesktopCardKey, number>>(DESKTOP_CARD_BASE_LAYER);
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

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const data = introData;
  const siteUrl = typeof window !== "undefined" ? window.location.origin : DEFAULT_SITE_URL;
  const [copiedToast, setCopiedToast] = useState(false);

  const handleAiClick = (dest: AiDestination) => {
    const prompt = dest.buildPrompt(siteUrl);
    if (dest.mode === "link") {
      window.open(dest.buildHref(prompt), "_blank", "noopener,noreferrer");
    } else {
      navigator.clipboard.writeText(prompt).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      });
      window.open(dest.targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const desktopLayout = getDesktopStageLayout(viewportWidth, viewportHeight);
  const desktopLayoutKey = `${desktopLayout.stageWidth}x${desktopLayout.stageHeight}`;

  const liftCard = (cardKey: DesktopCardKey) => {
    setCardLayers((currentLayers) => {
      const topLayer = Math.max(...Object.values(currentLayers));
      return {
        ...currentLayers,
        [cardKey]: topLayer + 1,
      };
    });
  };

  return (
    <section className="full-screen-bg intro-stage relative overflow-hidden">
      {/* --- Interactive Layout for Medium and Larger Screens --- */}
      <div className="absolute inset-0 hidden items-center justify-center px-6 py-8 md:flex">
        <div
          className="intro-desktop-stage"
        >
          <div
            className="intro-desktop-hero"
            style={{
              width: desktopLayout.hero.width,
              left: desktopLayout.hero.x,
              top: desktopLayout.hero.y,
            }}
          >
            <Tilt
              tiltMaxAngleX={15}
              tiltMaxAngleY={15}
              perspective={800}
              scale={1.05}
              transitionSpeed={2500}
              className="w-full"
            >
              <GlassCard className="flex flex-col items-center text-center p-10">
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
                <div className="flex justify-center items-stretch gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 hover:bg-white/[0.06] cursor-pointer"
                    onClick={() =>
                      window.scrollTo({
                        top: window.innerHeight,
                        behavior: "smooth",
                      })
                    }
                  >
                    Explore
                  </button>
                  <div className="inline-flex items-center gap-3.5 rounded-full border border-white/15 px-3.5 py-2 transition-colors duration-200 hover:bg-white/[0.06]">
                    <span className="text-xs font-semibold tracking-wider uppercase opacity-50 select-none">Ask AI</span>
                    {AI_DESTINATIONS.map((dest) => (
                      <button
                        key={dest.label}
                        type="button"
                        onClick={() => handleAiClick(dest)}
                        className={`transition-transform duration-300 hover:scale-110 cursor-pointer ${dest.hoverColor}`}
                        aria-label={`Summarize via ${dest.label}`}
                        title={dest.mode === "clipboard" ? `Copy prompt & open ${dest.label}` : `Summarize via ${dest.label}`}
                      >
                        <dest.Icon size={22} />
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </Tilt>
          </div>

        {/* Draggable Cards in desired order */}
        {/* Photo Card */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-photo`}
            cardKey="photo"
            defaultPosition={desktopLayout.cards.photo}
            layer={cardLayers.photo}
            onLift={liftCard}
          >
            <GlassCard className="p-2 w-60 text-center flex flex-col items-center">
              <img
                src={selfPic}
                alt="Personal"
                className="rounded-lg object-cover w-60 h-64"
                decoding="async"
                draggable={false}
              />
              <p className="text-sm text-gray-200 mt-3">Drag Me Around!</p>
            </GlassCard>
          </DesktopDraggableCard>

        {/* Latest Update */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-latest`}
            cardKey="latest"
            defaultPosition={desktopLayout.cards.latest}
            layer={cardLayers.latest}
            onLift={liftCard}
          >
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Latest Update</h4>
              <p className="text-sm text-gray-200">{data.latestUpdate}</p>
            </GlassCard>
          </DesktopDraggableCard>

        {/* My Recent Read */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-read`}
            cardKey="read"
            defaultPosition={desktopLayout.cards.read}
            layer={cardLayers.read}
            onLift={liftCard}
          >
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
          </DesktopDraggableCard>

        {/* Fun Fact */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-fact`}
            cardKey="fact"
            defaultPosition={desktopLayout.cards.fact}
            layer={cardLayers.fact}
            onLift={liftCard}
          >
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Fun Fact</h4>
              <p className="text-sm text-gray-200">{data.funFact}</p>
            </GlassCard>
          </DesktopDraggableCard>

        {/* Pong Game */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-pong`}
            cardKey="pong"
            defaultPosition={desktopLayout.cards.pong}
            layer={cardLayers.pong}
            onLift={liftCard}
          >
            <GlassCard className="flex flex-col items-center p-8">
              <Suspense fallback={<div className="h-[180px] w-[275px] animate-pulse bg-black/30 rounded" />}>
                <PongGame />
              </Suspense>
            </GlassCard>
          </DesktopDraggableCard>

        {/* Weather Card */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-weather`}
            cardKey="weather"
            defaultPosition={desktopLayout.cards.weather}
            layer={cardLayers.weather}
            onLift={liftCard}
          >
            <Suspense fallback={<MiniCardLoader title="Weather" />}>
              <WeatherCard />
            </Suspense>
          </DesktopDraggableCard>

        {/* GitHub Stats Card */}
          <DesktopDraggableCard
            key={`${desktopLayoutKey}-github`}
            cardKey="github"
            defaultPosition={desktopLayout.cards.github}
            layer={cardLayers.github}
            onLift={liftCard}
          >
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
          </DesktopDraggableCard>
        </div>
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
              <div className="flex justify-center items-stretch gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 hover:bg-white/[0.06] cursor-pointer"
                  onClick={() =>
                    window.scrollTo({
                      top: window.innerHeight,
                      behavior: "smooth",
                    })
                  }
                >
                  Explore
                </button>
                <div className="inline-flex items-center gap-3.5 rounded-full border border-white/15 px-3.5 py-2 transition-colors duration-200 hover:bg-white/[0.06]">
                  <span className="text-xs font-semibold tracking-wider uppercase opacity-50 select-none">Ask AI</span>
                  {AI_DESTINATIONS.map((dest) => (
                    <button
                      key={dest.label}
                      type="button"
                      onClick={() => handleAiClick(dest)}
                      className={`transition-transform duration-300 hover:scale-110 cursor-pointer ${dest.hoverColor}`}
                      aria-label={`Summarize via ${dest.label}`}
                      title={dest.mode === "clipboard" ? `Copy prompt & open ${dest.label}` : `Summarize via ${dest.label}`}
                    >
                      <dest.Icon size={22} />
                    </button>
                  ))}
                </div>
              </div>
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

      {/* Clipboard toast for Gemini */}
      {copiedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-fadeIn">
          <div className="glass rounded-full px-5 py-2.5 text-sm font-medium text-white/90 shadow-lg">
            Prompt copied — paste it into Gemini!
          </div>
        </div>
      )}
    </section>
  );
};

export default Intro;
