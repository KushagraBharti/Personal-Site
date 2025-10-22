import React from "react";
import Desktop from "./app/desktop/Desktop";
import RouteBridge from "./app/routes/RouteBridge";

const App: React.FC = () => {
  return (
    <>
      <RouteBridge />
      <Desktop />
    </>
  );
};

export default App;
