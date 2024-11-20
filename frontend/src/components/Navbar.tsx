import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <div className="text-lg font-semibold text-primary">
          <Link to="/">Kushagra Bharti</Link>
        </div>
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-600 hover:text-primary">
            Home
          </Link>
          <Link to="/blog" className="text-gray-600 hover:text-primary">
            Blog
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
