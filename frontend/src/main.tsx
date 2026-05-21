import "./index.css";

const path = window.location.pathname;

if (path === "/ai") {
  void import("./portfolio/pages/mountAiProfile").then(({ mountAiProfile }) =>
    mountAiProfile(),
  );
} else if (path.startsWith("/tracker")) {
  void import("./tracker/mountTracker").then(({ mountTracker }) =>
    mountTracker(),
  );
} else {
  void import("./portfolio/pages/mountHomePage").then(({ mountHomePage }) =>
    mountHomePage(),
  );
}
