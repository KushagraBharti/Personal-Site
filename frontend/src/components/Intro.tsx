// src/components/Intro.tsx
import React from "react";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import Draggable from "react-draggable"; // <-- Import react-draggable
import GlassCard from "./ui/GlassCard";
import GlassButton from "./ui/GlassButton";
import { FaEnvelope, FaMediumM, FaGithub, FaLinkedin } from "react-icons/fa";

import selfPic from "../assets/SelfPic.jpg";

const Intro: React.FC = () => {
  return (
    <section className="full-screen-bg relative overflow-hidden">
      {/* Main central card */}
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
            <p className="text-lg md:text-lg font-mono mb-6">
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

      {/* Draggable smaller cards */}

      {/* Personal Photo */}
      <Draggable>
        <div className="absolute top-24 left-96 cursor-grab active:cursor-grabbing">
          <GlassCard className="p-2 w-60 text-center flex flex-col items-center">
            <img
              src={selfPic}
              alt="Kushagra Bharti"
              className="rounded-lg object-cover w-60 h-64"
            />
            <p className="text-s text-gray-200 mt-3">Drag Me Around!</p>
          </GlassCard>
        </div>
      </Draggable>

      {/* GitHub Stats */}
      <Draggable>
        <div className="absolute top-[45%] left-[10%] cursor-grab active:cursor-grabbing">
          <GlassCard className="p-4 w-60 text-center">
            <h4 className="text-s font-bold text-white mb-1">Live GitHub Stats</h4>
            <p className="text-s text-gray-200">
              <strong>Repos:</strong> 17 <br />
              <strong>YTD Commits:</strong> 319 <br />
            </p>
          </GlassCard>
        </div>
      </Draggable>

      {/* LeetCode Progress */}
      <Draggable>
        <div className="absolute top-[80%] left-[20%] cursor-grab active:cursor-grabbing">
          <GlassCard className="p-4 w-60 text-center">
            <h4 className="text-s font-bold text-white mb-1">
              LeetCode Stats
            </h4>
            <p className="text-s text-gray-200">
              <strong>Solved:</strong> 6 <br />
              <strong>H/M/E:</strong> 4/1/1 <br />
            </p>
          </GlassCard>
        </div>
      </Draggable>

      {/* Latest Update */}
      <Draggable>
        <div className="absolute top-[68%] left-[45%] cursor-grab active:cursor-grabbing">
          <GlassCard className="p-4 w-64 text-center">
            <h4 className="text-s font-bold text-white mb-1">Latest Update</h4>
            <p className="text-s text-gray-200">
              Currently applying for Summer 2025 internships and leetcoding!
            </p>
          </GlassCard>
        </div>
      </Draggable>

      {/* Fun Fact */}
      <Draggable>
        <div className="absolute top-[47%] left-[82%] cursor-grab active:cursor-grabbing">
          <GlassCard className="p-4 w-64 text-center">
            <h4 className="text-s font-bold text-white mb-1">Fun Fact</h4>
            <p className="text-s text-gray-200">
              A film I made was screened at AMC Theatres in Times Square.
            </p>
          </GlassCard>
        </div>
      </Draggable>

      {/* Featured Blog */}
      <Draggable>
        <div className="absolute top-[5%] left-[55%] cursor-grab active:cursor-grabbing">
            <GlassCard className="p-4 w-60 text-center">
              <h4 className="text-s font-bold text-white mb-1">Featured Blog</h4>
              <a
                href="https://news.mit.edu/2025/ai-tool-generates-high-quality-images-faster-0321"
                target="_blank"
                rel="noopener noreferrer"
                className="">
                <p className="text-s text-gray-200 hover:text-[#0A66C2]">
                  “AI tool generates high-quality images faster than state-of-the-art approaches” - Adam Zewe | MIT News
                </p>
              </a>
            </GlassCard>
        </div>
      </Draggable>

      {/* AI Projects */}
      <Draggable>
        <div className="absolute top-[75%] left-[70%] cursor-grab active:cursor-grabbing">
          <GlassCard className="p-4 w-60 text-center">
            <h4 className="text-s font-bold text-white mb-1">AI Projects</h4>
            <p className="text-s text-gray-200">
              Pseudo-Lawyer <br />
              CircuitSeer <br />
              DataDrive <br />
            </p>
          </GlassCard>
        </div>
      </Draggable>

      {/* Travel Plans */}
      <Draggable>
        <div className="absolute top-[15%] left-[80%] cursor-grab active:cursor-grabbing">
          <GlassCard className="p-4 w-60 text-center">
            <h4 className="text-s font-bold text-white mb-1">Travel Plans</h4>
            <p className="text-s text-gray-200">
              Visiting Home for summer break! <br />
            </p>
          </GlassCard>
        </div>
      </Draggable>
    </section>
  );
};

export default Intro;
