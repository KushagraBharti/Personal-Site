import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import LazyIframe from "./ui/LazyIframe";

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
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1.5 }}
          className="mb-10 text-left"
        >
          <h2 className="relative inline-block text-4xl font-bold text-gray-50">
            {typedText}
            <Cursor />
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded"></span>
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.6fr_1fr]">
          <GlassCard className="w-full max-w-none mx-0 p-6 text-gray-200 space-y-5">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-50">
                Hey there! I'm Kushagra Bharti
              </h3>
              <p className="text-lg text-gray-100">
                An aspiring founder, but right now I am focused on building my
                skills and learning.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                Projects I'm working on
              </h4>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <span className="font-semibold">Monopoly Bench</span> - This is
                  a platform where various LLMs (including OpenAI models) can
                  play Monopoly against each other. I plan to publish a paper in
                  correlation to this project as well.
                </li>
                <li>
                  <span className="font-semibold">A light-weight web crawler in Go</span>{" "}
                  - I plan to use this project to learn Go, concurrency,
                  networking performance, and resource management.
                </li>
                <li>
                  <span className="font-semibold">
                    An open-source{" "}
                    <a
                      href="https://t3.chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-100 underline decoration-white/40 underline-offset-4 hover:text-[#D44638] hover:decoration-[#D44638]"
                    >
                      T3.chat
                    </a>{" "}
                    app
                  </span>{" "}
                  - I plan to use this project to fine-tune my web development
                  skills, implement creative ideas for chat apps, and
                  implementing my web crawler as a tool.
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                I am currently learning
              </h4>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <span className="font-semibold">Go (concurrency)</span> -
                  adding another backend language to my arsenal.
                </li>
                <li>
                  <span className="font-semibold">WebSockets</span> - building
                  and optimizing real-time applications.
                </li>
                <li>
                  <span className="font-semibold">Machine Learning Fundamentals</span>{" "}
                  - applying ML theory to projects and building models from
                  scratch.
                </li>
                <li>
                  <span className="font-semibold">
                    LLMs (tool-calling, context management, etc.)
                  </span>{" "}
                  - developing agent frameworks around large language models.
                </li>
                <li>
                  <span className="font-semibold">Networking Performance</span>{" "}
                  - optimizing network efficiency and throughput.
                </li>
                <li>
                  <span className="font-semibold">Resource Management</span> -
                  efficient memory and CPU utilization.
                </li>
                <li>
                  <span className="font-semibold">Data Management</span> - best
                  practices for handling and processing data at scale.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-50">
                Things outside of technology
              </h4>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  I love to <span className="font-semibold">cook</span>, and have
                  been cooking since I was five years old.
                </li>
                <li>
                  I love <span className="font-semibold">filmmaking</span>{" "}
                  (
                  <a
                    href="https://drive.google.com/file/d/1m3aFLAK4TE29ybbdOzObLS8zrrX3oJwM/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-100 underline decoration-white/40 underline-offset-4 hover:text-[#D44638] hover:decoration-[#D44638]"
                  >
                    portfolio link
                  </a>
                  ), I've{" "}
                  <span className="font-semibold">directed 2 short films</span>,
                  and have contributed to a few more as videographer and editor.
                </li>
                <li>
                  I love <span className="font-semibold">sports</span>. I play{" "}
                  <span className="font-semibold">
                    soccer, volleyball, tennis, and table tennis
                  </span>
                  ; and I also watch{" "}
                  <span className="font-semibold">
                    soccer (Visca Barca!), Formula 1, and the UFC
                  </span>
                  .
                </li>
                <li>
                  I am also interested in{" "}
                  <span className="font-semibold">finance</span> and the{" "}
                  <span className="font-semibold">
                    application of technology in finance
                  </span>
                  .
                </li>
                <li>
                  I am also interested in{" "}
                  <span className="font-semibold">psychology, reading, arts</span>
                  , etc.
                </li>
              </ul>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="w-full max-w-none mx-0 p-4 text-center text-gray-200">
              Check out my film work!
            </GlassCard>
            <GlassCard className="w-full max-w-none mx-0 overflow-hidden">
              <LazyIframe
                className="aspect-video"
                src="https://www.youtube.com/embed/WM6RvRfDCX4"
                title="St. Stephen's Dining Hall Documentary"
                loadingLabel="Buffering film..."
              />
              <p className="text-sm text-gray-200 mt-2 text-center">
                2022 - St. Stephen's Dining Hall Documentary
              </p>
            </GlassCard>

            <GlassCard className="w-full max-w-none mx-0 overflow-hidden">
              <LazyIframe
                className="aspect-video"
                src="https://www.youtube.com/embed/FS8l8G2p7PM"
                title="The PB&J Documentary"
                loadingLabel="Buffering film..."
              />
              <p className="text-sm text-gray-200 mt-2 text-center">
                2023 - The PB&J Documentary
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
