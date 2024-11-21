import React from "react";
import Navbar from "../components/Navbar";

const Blog: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-500">
      <Navbar />
      <main className="flex-grow flex items-center justify-center">
        <h1 className="container mx-auto section-heading">Blog, coming soon!</h1>
      </main>
    </div>
  );
};

export default Blog;
