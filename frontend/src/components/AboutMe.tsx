import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";

const AboutMe: React.FC = () => {
  const [startTyping, setStartTyping] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["About Me"] : [""],
    loop: false,
    typeSpeed: 120,
    deleteSpeed: 60,
    delaySpeed: 1000,
  });

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
        <GlassCard className="p-6 text-white space-y-4">
          <ul className="list-disc list-inside space-y-2 text-lg">
            <li>
              <strong>Filmmaking:</strong> All American High School Film Festival
              Nominee
            </li>
            <li>
              <strong>Tennis:</strong> Competed in Varsity
            </li>
            <li>
              <strong>Foodie:</strong> Seeking new culinary experiences across the
              globe
            </li>
            <li>
              <strong>Traveler:</strong> Lived in 3 countries &amp; visited 10
              in total
            </li>
          </ul>
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="mt-4 px-4 py-2 bg-black/40 text-white rounded hover:bg-black/70 transition-colors"
          >
            {showVideo ? "Hide Film" : "Watch My Film"}
          </button>
          {showVideo && (
            <div className="mt-4">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Film"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  );
};

export default AboutMe;
