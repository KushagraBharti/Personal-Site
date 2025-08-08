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
              Computer Science student at UT Dallas focused on applied machine
              learning and full-stack development. I explore hybrid optimization
              combining reinforcement learning with classical algorithms and
              model neural responses to real-world stimuli.
            </p>
            <p>
              Previously helped launch an LLM-powered training product at
              Abilitie—benchmarking deployment strategies to cut inference cost,
              building telemetry pipelines in TypeScript and DynamoDB, and
              polishing both fine-tuning and frontend UX.
            </p>
            <p>
              Actively seeking Summer 2025 internships in machine learning, data
              science, AI research, or full-stack development. Stack: Python,
              TypeScript, React, Flask, Node.js, AWS (SageMaker, Bedrock, EC2),
              PyTorch, TensorFlow, SQL.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Filmmaking – All American High School Film Festival nominee
              </li>
              <li>Tennis & soccer fan (Visca Barça!)</li>
              <li>Foodie and home cook chasing new cuisines</li>
              <li>Traveller – lived in 3 countries, visited 10+</li>
              <li>Gym rat and Formula 1 enthusiast</li>
            </ul>
          </GlassCard>

          <div className="space-y-6">
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

            <GlassCard className="p-4 text-center">
              <h4 className="text-lg font-semibold text-gray-50 mb-2">
                Photography Samples
              </h4>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a
                  href="https://drive.google.com/file/d/1C_NE9LsEFUwXJ8DoewZUHVWl14dthKvd/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Photo 1
                </a>
                <a
                  href="https://drive.google.com/file/d/1qV96I87FDxwIqZnv5R8s7e09OOZEUs8o/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Photo 2
                </a>
                <a
                  href="https://drive.google.com/file/d/1whFFNbwniIFgU1cQEcsD5PurugvdAIG4/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Photo 3
                </a>
                <a
                  href="https://drive.google.com/file/d/1Jj5exsNTSntwkotpzE4tNWB-6x-TqKjC/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Photo 4
                </a>
                <a
                  href="https://drive.google.com/file/d/16fi_GhyFVqD53qk8FON6OtSyE_w8TBBp/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Photo 5
                </a>
                <a
                  href="https://drive.google.com/file/d/1zk4s_n8wQzZCcqwrilFXzv1yzMzB4jDJ/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Photo 6
                </a>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
