import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.2 },
  }),
};

const AboutMe: React.FC = () => {
  const [startTyping, setStartTyping] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["About Me"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

  const videoId = "dQw4w9WgXcQ";

  return (
    <section className="py-16" id="about">
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
        <GlassCard className="p-6 text-white space-y-8 md:flex md:space-x-8">
          <div className="md:w-1/2 space-y-6">
            <motion.p
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              Hey, I’m Kushagra Bharti—a CS student at UT Dallas (Class of ’27) who’s
              been coding in four countries and lifting weights in all of them.
            </motion.p>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={1}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-2">Quick Bio</h3>
              <p className="text-gray-200">
                I’m pursuing a BS in Computer Science at UT Dallas (’27), but I’ve been
                roaming from Saudi to Austin to India to Richardson, TX—building ML
                pipelines, playing with code, and trying not to break everything
                along the way.
              </p>
            </motion.div>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={2}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-2">Professional Highlights</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  ✨ Machine Learning Intern @ Abilitie (Summer ’24) – I benchmarked
                  GPT-4, Claude 3.5, Llama 3.1, and shaved 80% off inference costs
                  (because who doesn’t love a cheap LLM?).
                </li>
                <li>
                  🔬 Undergrad Researcher @ UT Dallas (’25–present) – Working with
                  Dr. Daescu on drones, spanner graphs, and RL that probably
                  thinks it’s better at racing than I am.
                </li>
                <li>
                  💻 Built a full-stack AI legal-tech platform (PseudoLawyer) that
                  drafts contracts faster than you can say ‘Objection!’
                </li>
              </ul>
            </motion.div>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={3}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-2">Interests &amp; Hobbies</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  🎬 Filmmaking (All American High School Film Festival Nominee) –
                  Spent 200+ hours on my last short film (and only cried twice
                  editing).
                </li>
                <li>
                  🏋️ Gym &amp; Fitness – Bench-pressed 225 lbs once—my ego is
                  still recovering.
                </li>
                <li>
                  🏳 Tennis – Varsity competitor—still looking for someone to beat
                  me at deuce.
                </li>
                <li>
                  🌍 Global Traveler – Lived in 3 countries, wandered through 10
                  total—still haven’t found the best street taco.
                </li>
                <li>
                  🍣 Foodie – Will try anything once (except pineapple on
                  pizza—never).
                </li>
              </ul>
            </motion.div>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={4}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-2">Geek Stats</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  👾 Code Warrior Mode: 10,000+ lines of Python written this
                  semester.
                </li>
                <li>
                  📊 GPU Hours Logged: Enough to justify my coffee addiction.
                </li>
                <li>
                  🎮 Competitive Spirit: Top 5% on LeetCode in Data Structures
                  challenges.
                </li>
                <li>
                  ⏳ Film-Edit Hours: 150+ hours in Premiere Pro—eyes still blinking.
                </li>
              </ul>
            </motion.div>
            <motion.p
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={5}
              viewport={{ once: true }}
            >
              Want to nerd out about ML, film, or the perfect taco? Find me on
              LinkedIn or drop an email at
              <a
                href="mailto:kushagrabharti@gmail.com"
                className="underline hover:text-primary"
              >
                kushagrabharti@gmail.com
              </a>
              .
            </motion.p>
          </div>
          <div className="md:w-1/2 flex flex-col items-center mt-8 md:mt-0">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={6}
              viewport={{ once: true }}
              className="cursor-pointer relative group"
              onClick={() => setVideoOpen(!videoOpen)}
            >
              {videoOpen ? (
                <iframe
                  className="w-full aspect-video rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Meta-Mind Film"
                  allowFullScreen
                ></iframe>
              ) : (
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Meta-Mind thumbnail"
                  className="w-full rounded-lg group-hover:shadow-lg group-hover:scale-105 transition-transform"
                />
              )}
              {!videoOpen && (
                <span className="absolute inset-0 rounded-lg ring-2 ring-primary animate-pulse group-hover:animate-none"></span>
              )}
            </motion.div>
            <motion.p
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              custom={7}
              viewport={{ once: true }}
              className="mt-2 text-sm text-gray-200 text-center"
            >
              🎥 Check out my latest short film: “Meta-Mind” (All American HS
              Film Festival ’23).
            </motion.p>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};

export default AboutMe;
