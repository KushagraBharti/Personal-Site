// src/components/Intro.tsx
import React from "react";
import { motion } from "framer-motion";
import GlassCard from "./ui/GlassCard"; 
import GlassButton from "./ui/GlassButton"; 
import { FaEnvelope, FaMediumM, FaGithub, FaLinkedin } from "react-icons/fa";

const Intro: React.FC = () => {
  return (
    <section className="full-screen-bg relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="flex items-center justify-center h-full"
      >
        <GlassCard className="max-w-lg mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-playfair mb-4">
            Kushagra Bharti
          </h1>
          <p className="text-base md:text-lg font-mono mb-6">
            Student | Software Engineer | ML Enthusiast
          </p>
          
          <div className="flex justify-center space-x-6 mb-6">
            {/* Email */}
            <a
              href="mailto:kushagrabharti@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:text-[#D44638]" // Gmail red-ish, adjust as needed
            >
              <FaEnvelope size={24} />
            </a>
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/kushagra-bharti/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:text-[#0A66C2]"
            >
              <FaLinkedin size={24} />
            </a>
            {/* GitHub */}
            <a
              href="https://github.com/kushagrabharti"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:text-[#6e40c9]"
            >
              <FaGithub size={24} />
            </a>
            {/* Medium */}
            <a
              href="https://medium.com/@kushagrabharti"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:text-[#00ab6c]" // Medium green-ish, adjust as needed
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
      </motion.div>
    </section>
  );
};

export default Intro;
