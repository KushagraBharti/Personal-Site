// frontend/src/components/Intro.tsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import Tilt from "react-parallax-tilt";
import Draggable from "react-draggable";
import GlassCard from "./ui/GlassCard";
import GlassButton from "./ui/GlassButton";
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

const buildAiSummaryRequestPrompt = (siteUrl: string) =>
  `Read ${siteUrl}/ai and summarize Kushagra Bharti for a first-time visitor. Use that page as the source of truth.`;

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

const getDesktopStageLayout = (
  viewportWidth: number,
  viewportHeight: number
): DesktopStageLayout => {
  const stageWidth = clamp(viewportWidth - 56, 1180, 1680);
  const stageHeight = clamp(viewportHeight - 32, 860, 980);
  const heroHeight = 360;
  const heroWidth = stageWidth >= 1600 ? 540 : stageWidth >= 1450 ? 510 : stageWidth >= 1280 ? 480 : 450;

  const presetLayout =
    stageWidth >= 1600
      ? {
          hero: { x: 560, y: 252 },
          cards: {
            photo: { x: 215, y: 188 },
            github: { x: 60, y: 504 },
            read: { x: 1018, y: 120 },
            weather: { x: 1435, y: 236 },
            fact: { x: 1450, y: 500 },
            latest: { x: 742, y: 626 },
            pong: { x: 1176, y: 662 },
          },
        }
      : stageWidth >= 1450
        ? {
            hero: { x: 470, y: 248 },
            cards: {
              photo: { x: 122, y: 170 },
              github: { x: 18, y: 488 },
              read: { x: 838, y: 116 },
              weather: { x: 1155, y: 228 },
              fact: { x: 1178, y: 485 },
              latest: { x: 610, y: 602 },
              pong: { x: 935, y: 648 },
            },
          }
        : stageWidth >= 1280
          ? {
              hero: { x: 390, y: 245 },
              cards: {
                photo: { x: 70, y: 160 },
                github: { x: 14, y: 470 },
                read: { x: 710, y: 110 },
                weather: { x: 960, y: 226 },
                fact: { x: 980, y: 470 },
                latest: { x: 505, y: 594 },
                pong: { x: 760, y: 636 },
              },
            }
          : {
              hero: { x: 340, y: 238 },
              cards: {
                photo: { x: 30, y: 160 },
                github: { x: 16, y: 468 },
                read: { x: 585, y: 112 },
                weather: { x: 805, y: 226 },
                fact: { x: 822, y: 470 },
                latest: { x: 438, y: 594 },
                pong: { x: 610, y: 636 },
              },
            };

  const cards = {
    photo: {
      x: clamp(presetLayout.cards.photo.x, 24, stageWidth - 240),
      y: clamp(presetLayout.cards.photo.y, 24, stageHeight - 338),
    },
    github: {
      x: clamp(presetLayout.cards.github.x, 18, stageWidth - 240),
      y: clamp(presetLayout.cards.github.y, 24, stageHeight - 152),
    },
    read: {
      x: clamp(presetLayout.cards.read.x, 24, stageWidth - 240),
      y: clamp(presetLayout.cards.read.y, 24, stageHeight - 148),
    },
    weather: {
      x: clamp(presetLayout.cards.weather.x, 24, stageWidth - 240),
      y: clamp(presetLayout.cards.weather.y, 24, stageHeight - 148),
    },
    fact: {
      x: clamp(presetLayout.cards.fact.x, 24, stageWidth - 256),
      y: clamp(presetLayout.cards.fact.y, 24, stageHeight - 170),
    },
    latest: {
      x: clamp(presetLayout.cards.latest.x, 24, stageWidth - 256),
      y: clamp(presetLayout.cards.latest.y, 24, stageHeight - 164),
    },
    pong: {
      x: clamp(presetLayout.cards.pong.x, 24, stageWidth - 340),
      y: clamp(presetLayout.cards.pong.y, 24, stageHeight - 316),
    },
  } satisfies Record<DesktopCardKey, CardPosition>;

  return {
    stageWidth,
    stageHeight,
    hero: {
      width: heroWidth,
      height: heroHeight,
      x: presetLayout.hero.x,
      y: presetLayout.hero.y,
    },
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
  const summaryPrompt = buildAiSummaryRequestPrompt(
    typeof window !== "undefined" ? window.location.origin : DEFAULT_SITE_URL
  );
  const desktopLayout = getDesktopStageLayout(viewportWidth, viewportHeight);

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
          style={{ width: desktopLayout.stageWidth, height: desktopLayout.stageHeight }}
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

        {/* Draggable Cards in desired order */}
        {/* Photo Card */}
          <DesktopDraggableCard
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
