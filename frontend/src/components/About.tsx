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
        {/* Typed heading */}
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

        {/* Bio and Interests */}
        <div className="grid gap-8 md:grid-cols-2">
          <GlassCard className="p-6 text-gray-200 leading-relaxed space-y-4">
            <p>
              CS + Applied ML Research @ UTD | Full-Stack & ML Engineering |
              Data-Driven Modeling & Analytics | LLM Integration
            </p>
            <p>
              I'm a computer science student at UT Dallas focused on applied
              machine learning and full-stack development. I work with the CS
              department head on hybrid optimization that blends reinforcement
              learning with classical algorithms and I'm joining the CoCo-Neuro
              Lab to model neural responses to real-world stimuli.
            </p>
            <p>
              Previously, I helped launch an LLM-powered training product at
              Abilitie where I benchmarked deployment strategies to trim
              inference cost, engineered telemetry pipelines in TypeScript and
              DynamoDB, and shipped both model fine-tuning and frontend UX
              fixes.
            </p>
            <p>
              Outside of work I've built a stock trading engine with the Alpaca
              API, an autonomous racing sim using RL, full-stack contract
              generators with LLMs, and several analytics dashboards. I'm
              actively seeking Summer 2025 internships in machine learning, data
              science & engineering, AI research, or full-stack development.
            </p>
            <p>
              <span className="font-semibold">Stack:</span> Python, TypeScript,
              React, Flask, Node.js, AWS (SageMaker, Bedrock, EC2), PyTorch,
              TensorFlow, SQL
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-50">
              Interests
            </h3>
            <ul className="list-disc list-inside text-gray-200 space-y-2">
              <li>Filmmaking – All American High School Film Festival nominee</li>
              <li>Tennis – varsity competitor</li>
              <li>Foodie chasing new culinary experiences</li>
              <li>
                Travel – lived in 3 countries and visited 10 others
              </li>
              <li>Gym, soccer (Barça fan) and Formula 1</li>
            </ul>
          </GlassCard>
        </div>

        {/* Film cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <GlassCard className="p-4">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded"
                src="https://www.youtube.com/embed/WM6RvRfDCX4"
                title="St. Stephen's Dining Hall Documentary"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="mt-4 text-gray-200 text-center">
              2022 - St. Stephen’s Dining Hall Documentary
            </p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded"
                src="https://www.youtube.com/embed/FS8l8G2p7PM"
                title="The PB&J Documentary"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="mt-4 text-gray-200 text-center">
              2023 - The PB&J Documentary
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};

export default About;

