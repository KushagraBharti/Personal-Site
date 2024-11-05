import React from "react";
import Navbar from "../components/Navbar";
import Introduction from "../components/Intro";
import Projects from "../components/Projects";
import Experiences from "../components/Experience";
import Contact from "../components/Contact";

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      <Navbar />
      <Introduction />
      <Experiences />
      <Projects />
      <Contact />
    </div>
  );
};

export default Home;
