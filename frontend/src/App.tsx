import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import ScrollProgress from "./components/ScrollProgress";
import SectionSidebar from "./components/SectionSidebar";



const App: React.FC = () => {
  return (
    <Router>
      <ScrollProgress />
      <SectionSidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
      </Routes>
    </Router>
  );
};

export default App;
