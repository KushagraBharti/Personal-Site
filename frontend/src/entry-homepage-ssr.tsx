import React from "react";
import { renderToString } from "react-dom/server";
import HomePageApp from "./portfolio/pages/HomePageApp";

export const renderHomepage = () =>
  renderToString(
    <React.StrictMode>
      <HomePageApp />
    </React.StrictMode>
  );
