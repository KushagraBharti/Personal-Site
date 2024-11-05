import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="flex justify-between items-center py-4 px-6 bg-gray-100 shadow-md">
      <div className="space-x-4">
        <Link to="/" className="text-gray-700">Home</Link>
      </div>
    </nav>
  );
};

export default Navbar;
