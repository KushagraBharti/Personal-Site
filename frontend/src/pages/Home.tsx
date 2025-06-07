// src/pages/Home.tsx
import React from "react";
import Intro from "../components/Intro";
import AboutMe from "../components/AboutMe";
import Education from "../components/Education";
import Experiences from "../components/Experience";
import Projects from "../components/Projects";


const Home: React.FC = () => {
  return (
    <div>
      <section id="intro">
        <Intro />
      </section>
      <section id="about">
        <AboutMe />
      </section>
      <section id="education">
        <Education />
      </section>
      <section id="experiences">
        <Experiences />
      </section>
      <section id="projects">
        <Projects />
      </section>
    </div>
  );
};

export default Home;

/* 
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
      <main className="text-center min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-500">
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
*/