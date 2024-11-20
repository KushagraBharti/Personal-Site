import React from "react";
import Navbar from "../components/Navbar";
import Introduction from "../components/Intro";
import Education from "../components/Education";
import Projects from "../components/Projects";
import Experiences from "../components/Experience";
import Contact from "../components/Contact";

const Home: React.FC = () => {
  return (
    <div>
      <Navbar />
      <main className="text-center py-16 bg-gradient-to-b from-gray-50 to-gray-500">
        <Introduction />
        <Education />
        <Experiences />
        <Projects />
        <Contact />
      </main>
    </div>
  );
};

export default Home;
