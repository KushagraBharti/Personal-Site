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
      <main className="px-4 mx-auto max-w-screen-xl">
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
