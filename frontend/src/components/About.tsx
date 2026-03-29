import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import LazyIframe from "./ui/LazyIframe";
import { getApiBaseUrl } from "../lib/apiBaseUrl";
import type { PortfolioSnapshot } from "../types/portfolio";

const fallbackAbout = {
  introHeading: "Hey there! I'm Kushagra Bharti",
  introBody: "An aspiring founder, but right now I am focused on building my skills and learning.",
  currentProjects: [
    "Monopoly Bench - A platform where various LLMs can play Monopoly against each other; I plan to publish a paper connected to this work.",
    "A light-weight web crawler in Go - A project I am using to learn Go, concurrency, networking performance, and resource management.",
    "An open-source T3.chat app - A project I am using to sharpen my web development skills, try creative chat UX ideas, and eventually integrate my web crawler as a tool.",
  ],
  currentLearning: [
    "Go, especially concurrency.",
    "WebSockets and real-time applications.",
    "Machine learning fundamentals.",
    "LLMs, including tool-calling and context management.",
    "Networking performance.",
    "Resource management.",
    "Data management.",
  ],
  interestsOutsideTechnology: [
    "I love cooking and have been cooking since I was five years old.",
    "I love filmmaking, have directed 2 short films, and have contributed to other productions as a videographer and editor.",
    "I love sports, especially soccer, volleyball, tennis, and table tennis, and I also follow soccer, Formula 1, and the UFC.",
    "I am interested in finance and the application of technology in finance.",
    "I am interested in psychology, reading, and the arts.",
  ],
};

const About: React.FC = () => {
  const [startTyping, setStartTyping] = useState(false);
  const [about, setAbout] = useState(fallbackAbout);
  const [filmPortfolioLink, setFilmPortfolioLink] = useState(
    "https://drive.google.com/file/d/1m3aFLAK4TE29ybbdOzObLS8zrrX3oJwM/view?usp=sharing"
  );
  const [typedText] = useTypewriter({
    words: startTyping ? ["About Me"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await axios.get<PortfolioSnapshot>(`${getApiBaseUrl()}/api/portfolio`, {
          signal: controller.signal,
        });
        const snapshot = response.data;
        const filmLink = snapshot.profile.externalLinks.find((link) => link.label === "Film Portfolio");

        setAbout(snapshot.profile.about);
        if (filmLink) {
          setFilmPortfolioLink(filmLink.href);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load about profile content:", error);
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, []);

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1.5 }}
          className="mb-12 text-left"
        >
          <h2 className="relative inline-block text-4xl md:text-5xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="section-accent-bar"></span>
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.6fr_1fr]">
          <GlassCard className="w-full max-w-none mx-0 p-7 md:p-8 text-gray-200 space-y-6">
            <div className="space-y-2.5">
              <h3 className="text-2xl font-semibold text-gray-50">
                {about.introHeading}
              </h3>
              <p className="text-lg leading-relaxed text-gray-100/90">
                {about.introBody}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                Projects I'm working on
              </h4>
              <ol className="list-decimal list-inside space-y-2.5 leading-relaxed">
                {about.currentProjects.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                I am currently learning
              </h4>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                {about.currentLearning.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                Things outside of technology
              </h4>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                {about.interestsOutsideTechnology.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>
                  Film portfolio:{" "}
                  <a
                    href={filmPortfolioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-100 underline decoration-white/30 underline-offset-4 hover:text-[#D44638] hover:decoration-[#D44638] transition-colors duration-200"
                  >
                    {filmPortfolioLink}
                  </a>
                </li>
              </ul>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="w-full max-w-none mx-0 px-5 py-3.5 text-center">
              <p className="text-sm font-semibold tracking-wider uppercase text-gray-200/80">Check out my film work</p>
            </GlassCard>
            <GlassCard className="w-full max-w-none mx-0 overflow-hidden p-0">
              <LazyIframe
                className="aspect-video"
                src="https://www.youtube.com/embed/WM6RvRfDCX4"
                title="St. Stephen's Dining Hall Documentary"
                loadingLabel="Buffering film..."
              />
              <p className="text-sm text-gray-200/80 py-3 text-center font-medium">
                2022 &mdash; St. Stephen's Dining Hall Documentary
              </p>
            </GlassCard>

            <GlassCard className="w-full max-w-none mx-0 overflow-hidden p-0">
              <LazyIframe
                className="aspect-video"
                src="https://www.youtube.com/embed/FS8l8G2p7PM"
                title="The PB&J Documentary"
                loadingLabel="Buffering film..."
              />
              <p className="text-sm text-gray-200/80 py-3 text-center font-medium">
                2023 &mdash; The PB&J Documentary
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
