import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";

const About: React.FC = () => {
  const [startTyping, setStartTyping] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["About Me"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  return (
    <section className="py-16">
      <div className="container mx-auto max-w-screen-xl px-4 md:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="mb-10 text-center"
        >
          <h2 className="relative inline-block text-4xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded"></span>
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          <GlassCard className="p-6 text-gray-200 space-y-4">
            <p>
              Hey! I'm a CS major at
              <a
                href="https://www.utdallas.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                UT Dallas
              </a>
              who loves blending applied machine learning with full-stack
              tinkering. These days I'm either building routing models that mix
              reinforcement learning with classic algorithms or exploring how
              brains react to real-world stimuli.
            </p>
            <p>
              Last summer I hopped on
              <a
                href="https://www.abilitie.com/ai-cases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Abilitie's
              </a>
              team to ship an LLM-powered training product. I benchmarked
              deployment tricks to shrink inference bills, spun up telemetry
              pipelines in TypeScript and DynamoDB, and tweaked both fine-tuning
              and frontend UX.
            </p>
            <p>
              I'm on the lookout for a Summer 2025 internship in ML, data, or
              full-stack work. I mostly code in Python and TypeScript and mess
              around with React, Flask, Node.js, AWS, PyTorch, TensorFlow, and
              SQL.
            </p>
            <p>
              Away from the keyboard, you'll catch me behind a camera—my dining
              hall documentary was screened at the
              <a
                href="https://www.hsfilmfest.com/2023-official-selections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                All American High School Film Festival
              </a>
              —or chasing tennis rallies and La Liga scores (Visca Barça!). I
              love experimenting in the kitchen, traveling (I've lived in three
              countries and visited ten-plus), hitting the gym, and keeping up
              with Formula 1.
            </p>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-4 text-center text-gray-200">
              <a
                href="https://www.hsfilmfest.com/2023-official-selections"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Check out my film work
              </a>
            </GlassCard>
            <GlassCard className="overflow-hidden">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/WM6RvRfDCX4"
                  title="St. Stephen’s Dining Hall Documentary"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-sm text-gray-200 mt-2 text-center">
                2022 – St. Stephen’s Dining Hall Documentary
              </p>
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/FS8l8G2p7PM"
                  title="The PB&J Documentary"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-sm text-gray-200 mt-2 text-center">
                2023 – The PB&J Documentary
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
