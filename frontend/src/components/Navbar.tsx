import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="navbar flex justify-between items-center">
      <div className="space-x-4">
        <Link to="/" className="text-primary font-semibold hover:underline">
          Home
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
