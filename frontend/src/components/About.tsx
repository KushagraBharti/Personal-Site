import React from "react";
import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";
import GlassCard from "./ui/GlassCard";
import { FaFilm, FaUtensils, FaPlane, FaDumbbell, FaFutbol, FaFlagCheckered } from "react-icons/fa";
import { GiTennisBall } from "react-icons/gi";

const AboutTextCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <GlassCard className={`p-6 text-left space-y-4 ${className}`}>
    <h3 className="text-2xl font-semibold text-gray-50">
      CS + Applied ML Research @ UTD
    </h3>
    <p className="text-gray-200 text-sm md:text-base">
      Computer Science student at UT Dallas focused on applied machine learning and full-stack development. I research hybrid optimization strategies that pair reinforcement learning with classical algorithms and model neural responses to real-world stimuli in the CoCo-Neuro Lab.
    </p>
    <p className="text-gray-200 text-sm md:text-base">
      Previously at Abilitie I helped launch an LLM-powered training product—benchmarking deployment strategies to cut inference cost, engineering telemetry pipelines in TypeScript and DynamoDB, and contributing to model fine-tuning and frontend polish. Outside of work I've built stock trading engines with the Alpaca API, an autonomous racing sim using RL, full-stack legal contract generators with LLMs, and various analytics dashboards.
    </p>
    <p className="text-gray-200 text-sm md:text-base">
      Actively seeking Summer 2025 internships in machine learning, data science & engineering, AI research, or full-stack development.
    </p>
    <p className="text-gray-200 text-sm md:text-base">
      <strong>Stack:</strong> Python, TypeScript, React, Flask, Node.js, AWS (SageMaker, Bedrock, EC2), PyTorch, TensorFlow, SQL
    </p>
  </GlassCard>
);

const VideoCard: React.FC<{ embedId: string }> = ({ embedId }) => (
  <GlassCard className="p-4 flex items-center justify-center">
    <iframe
      src={`https://www.youtube.com/embed/${embedId}`}
      title="YouTube video"
      className="w-full h-56 md:h-full rounded-lg"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  </GlassCard>
);

const InterestsCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <GlassCard className={`p-6 ${className}`}>
    <h3 className="text-xl font-semibold text-gray-50 mb-4">Interests</h3>
    <ul className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 text-gray-200 text-sm md:text-base">
      <li className="flex items-center"><FaFilm className="mr-2" />Filmmaking (AAHSFF nominee)</li>
      <li className="flex items-center"><GiTennisBall className="mr-2" />Tennis (former varsity)</li>
      <li className="flex items-center"><FaUtensils className="mr-2" />Foodie & home cook</li>
      <li className="flex items-center"><FaPlane className="mr-2" />Avid traveller (lived in 3 countries, visited 10)</li>
      <li className="flex items-center"><FaDumbbell className="mr-2" />Gym regular</li>
      <li className="flex items-center"><FaFutbol className="mr-2" />Soccer (Barça fan)</li>
      <li className="flex items-center"><FaFlagCheckered className="mr-2" />Formula 1 enthusiast</li>
    </ul>
  </GlassCard>
);

const About: React.FC = () => {
  const [startTyping, setStartTyping] = React.useState(false);
  const [typedText] = useTypewriter({
    words: startTyping ? ["About Me"] : [""] ,
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
            <span className="block w-16 h-1 bg-primary mx-auto mt-2 rounded" />
          </h2>
        </motion.div>

        <div className="hidden md:grid grid-cols-3 gap-8 items-stretch">
          <AboutTextCard className="col-span-2" />
          <VideoCard embedId="WM6RvRfDCX4" />
          <VideoCard embedId="FS8l8G2p7PM" />
          <InterestsCard className="col-span-3" />
        </div>

        <div className="block md:hidden space-y-4">
          <AboutTextCard />
          <VideoCard embedId="WM6RvRfDCX4" />
          <VideoCard embedId="FS8l8G2p7PM" />
          <InterestsCard />
        </div>
      </div>
    </section>
  );
};

export default About;
