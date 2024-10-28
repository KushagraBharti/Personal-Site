import React from "react";
import Navbar from "../components/Navbar";

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      <Navbar />
      <section className="text-center mt-10">
        <h1 className="text-4xl font-bold">Hello, I'm [Your Name]</h1>
        <p className="mt-4 text-gray-600">
          Software Developer | Machine Learning Enthusiast
        </p>
        <div className="mt-6 space-x-4">
          <a href="/projects" className="text-blue-500 underline">
            Projects
          </a>
          <a href="/contact" className="text-blue-500 underline">
            Contact
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;
