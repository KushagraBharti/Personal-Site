import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="flex justify-between items-center py-4 px-6 bg-gray-100 shadow-md">
      <h1 className="text-lg font-bold">My Portfolio</h1>
      <div className="space-x-4">
        <Link to="/" className="text-gray-700">Home</Link>
        <Link to="/projects" className="text-gray-700">Projects</Link>
        <Link to="/contact" className="text-gray-700">Contact</Link>
      </div>
    </nav>
  );
};

export default Navbar;
