// frontend/src/components/Intro.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Tilt from "react-parallax-tilt";
import Draggable from "react-draggable";
import GlassCard from "./ui/GlassCard";
import GlassButton from "./ui/GlassButton";
import WeatherCard from "./WeatherCard";
import LeetCodeStatsCard from "./LeetCodeStatsCard";
import PongGame from "./PongGame";
import { FaEnvelope, FaMediumM, FaGithub, FaLinkedin } from "react-icons/fa";
import selfPic from "/SelfPic.jpg";

interface IntroResponse {
  personalPhoto: string;
  githubStats: { totalRepos: number; totalCommits: number } | null;
  leetCodeStats: { totalSolved: number; rank: string } | null;
  weather: { city: string; temp: number; description: string } | null;
  latestUpdate: string;
  funFact: string;
  featuredBlog: { title: string; link: string };
  aiProjects: string[];
  travelPlans: string;
}

// Fallback default data for instant load
const defaultIntroData: IntroResponse = {
  personalPhoto: "placeholder.jpg",
  githubStats: { totalRepos: 17, totalCommits: 250 },
  leetCodeStats: { totalSolved: 6, rank: "4/1/1" },
  weather: { city: "N/A", temp: 0, description: "N/A" },
  latestUpdate: "Currently applying for Summer 2025 internships and leetcoding!",
  funFact: "A film I made was screened at AMC Theatres in Times Square!",
  featuredBlog: {
    title: "How AI is Shaping the Future of Software Development",
    link: "https://news.mit.edu/2025/ai-tool-generates-high-quality-images-faster-0321",
  },
  aiProjects: ["Placeholder project"],
  travelPlans: "No travel plans yet",
};

const Intro: React.FC = () => {
  const [introData, setIntroData] = useState<IntroResponse>(defaultIntroData);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const fetchIntroData = async () => {
      try {
        const res = await axios.get<IntroResponse>(
          `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api/intro`
        );
        setIntroData(res.data);
      } catch (error) {
        console.error("Error fetching intro data:", error);
      }
    };
    fetchIntroData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const data = introData;

  return (
    <section className="full-screen-bg relative overflow-hidden">
      {/* Main central card – always visible */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Tilt
          tiltMaxAngleX={15}
          tiltMaxAngleY={15}
          perspective={800}
          scale={1.05}
          transitionSpeed={2500}
          className="max-w-2xl mx-auto"
        >
          <GlassCard className="flex flex-col items-center text-center p-10">
            <h1 className="text-5xl md:text-6xl font-playfair mb-4">
              Kushagra Bharti
            </h1>
            <p className="text-lg font-mono mb-6">
              Student | Software Engineer | ML Enthusiast
            </p>
            <div className="flex justify-center space-x-6 mb-6">
              {/* Social Icons */}
              <a
                href="mailto:kushagrabharti@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#D44638]"
              >
                <FaEnvelope size={24} />
              </a>
              <a
                href="https://www.linkedin.com/in/kushagra-bharti/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#0A66C2]"
              >
                <FaLinkedin size={24} />
              </a>
              <a
                href="https://github.com/kushagrabharti"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#6e40c9]"
              >
                <FaGithub size={24} />
              </a>
              <a
                href="https://medium.com/@kushagrabharti"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-110 hover:text-[#00ab6c]"
              >
                <FaMediumM size={24} />
              </a>
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

      {/* Draggable Cards for Medium and Larger Screens */}
      <div className="hidden md:block">
        {/* Photo Card */}
        <Draggable>
          <div className="absolute top-24 left-96 cursor-grab active:cursor-grabbing">
            <GlassCard className="p-2 w-60 text-center flex flex-col items-center">
              <img
                src={selfPic}
                alt="Personal"
                className="rounded-lg object-cover w-60 h-64"
              />
              <p className="text-sm text-gray-200 mt-3">Drag Me Around!</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* Latest Update */}
        <Draggable>
          <div className="absolute top-[68%] left-[45%] cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-64 text-center">
              <h4 className="text-sm font-bold text-white mb-1">
                Latest Update
              </h4>
              <p className="text-sm text-gray-200">{data.latestUpdate}</p>
            </GlassCard>
          </div>
        </Draggable>

        {/* My Recent Read */}
        <Draggable>
          <div className="absolute top-[5%] left-[55%] cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-60 text-center">
              <h4 className="text-sm font-bold text-white mb-1">
                My Recent Read
              </h4>
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
              <PongGame />
            </GlassCard>
          </div>
        </Draggable>

        {/* Weather Card */}
        <Draggable>
          <div className="absolute top-[15%] left-[80%] cursor-grab active:cursor-grabbing">
            <WeatherCard />
          </div>
        </Draggable>

        {/* LeetCode Stats Card */}
        <Draggable>
          <div className="absolute top-[80%] left-[20%] cursor-grab active:cursor-grabbing">
            <LeetCodeStatsCard />
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
                <p className="text-sm text-red-300">GitHub stats unavailable</p>
              )}
            </GlassCard>
          </div>
        </Draggable>
      </div>

      {/* Mobile Fallback: Static layout for smaller screens */}
      <div className="block md:hidden p-4 space-y-4">
        {/* Here you can stack the cards vertically in a simplified layout */}
        <GlassCard className="w-full text-center">
          <img
            src={selfPic}
            alt="Personal"
            className="rounded-lg object-cover w-full h-48"
          />
          <p className="text-sm text-gray-200 mt-2">Your Photo</p>
        </GlassCard>
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
        {/* For mobile, you might choose to hide Pong and some stats, or render simplified versions */}
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
