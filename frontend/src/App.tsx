import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "\.\\pages\\Home";
import Blog from "\.\\pages\\Blog";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
      </Routes>
    </Router>
  );
};

export default App;
