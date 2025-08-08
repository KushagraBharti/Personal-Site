// src/components/About.tsx
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
          className="mb-10"
        >
          <h2 className="relative inline-block text-4xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded"></span>
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          <GlassCard className="p-6 text-gray-50 space-y-4">
            <p>
              CS + Applied ML Research @ UTD | Full-Stack & ML Engineering |
              Data-Driven Modeling & Analytics | LLM Integration
            </p>
            <p>
              I'm a Computer Science student at UT Dallas focused on applied
              machine learning and full-stack development. I currently conduct
              research under UTD’s CS department head, exploring hybrid
              optimization techniques combining reinforcement learning with
              classical algorithms. I'm also joining the CoCo-Neuro Lab where we
              model neural responses to real-world stimuli using neural networks
              and behavioral data.
            </p>
            <p>
              Previously I interned at Abilitie, helping launch an LLM-powered
              training product. I benchmarked model deployment strategies to cut
              inference cost, engineered telemetry pipelines in TypeScript and
              DynamoDB, and contributed to both model fine-tuning and frontend
              UX fixes. Outside of work I've built a stock trading engine with
              the Alpaca API, an autonomous racing sim using RL, full-stack
              legal contract generators with LLMs, and several analytics
              dashboards.
            </p>
            <p>
              I'm actively seeking Summer 2025 internships in machine learning,
              data science & engineering, AI research, or full-stack
              development.
            </p>
            <p className="text-sm text-gray-200">
              Stack: Python, TypeScript, React, Flask, Node.js, AWS (SageMaker,
              Bedrock, EC2), PyTorch, TensorFlow, SQL
            </p>
            <p className="text-sm text-gray-200">
              Interests: Filmmaking (All American High School Film Festival
              nominee), tennis (varsity competitor), foodie exploring global
              cuisine, avid traveller who's lived in 3 countries and visited 10,
              cooking, hitting the gym, soccer (Barça fan), and Formula 1.
            </p>
          </GlassCard>

          <div className="flex flex-col gap-8">
            <GlassCard className="p-4">
              <div className="relative w-full overflow-hidden rounded-lg aspect-video">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/WM6RvRfDCX4"
                  title="St. Stephen's Dining Hall Documentary"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white text-center">
                St. Stephen's Dining Hall Documentary
              </h3>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="relative w-full overflow-hidden rounded-lg aspect-video">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/FS8l8G2p7PM"
                  title="The PB&J Documentary"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white text-center">
                The PB&J Documentary
              </h3>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

