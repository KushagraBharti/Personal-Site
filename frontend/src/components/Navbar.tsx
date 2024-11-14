//import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="navbar bg-background border-b border-secondary">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <div className="text-primary font-bold text-0">
          <Link to="/">Kushagra Bharti<br />Student @ UT Dallas</Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-secondary font-semibold hover:text-primary">Home</Link>
          <Link to="/blog" className="text-secondary font-semibold hover:text-primary">Blog</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
