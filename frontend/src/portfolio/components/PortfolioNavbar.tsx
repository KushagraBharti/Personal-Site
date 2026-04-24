import React, { useEffect, useState } from "react";

const navItems: Array<{ label: string; href: string }> = [
  { label: "home", href: "#top" },
  { label: "about me", href: "#about" },
  { label: "recents", href: "#featured" },
  { label: "experiences", href: "#experiences" },
  { label: "projects", href: "#projects" },
  { label: "film", href: "#film" },
  { label: "contact", href: "#misc" },
];

const PortfolioNavbar: React.FC = () => {
  const [activeHref, setActiveHref] = useState("#top");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const getActiveHref = () => {
      const scrollY = window.scrollY + 140;
      let nextActive = "#top";

      for (const item of navItems) {
        const id = item.href.slice(1);
        const section = document.getElementById(id);

        if (!section) continue;
        if (section.offsetTop <= scrollY) {
          nextActive = item.href;
        }
      }

      return nextActive;
    };

    let ticking = false;

    const updateActive = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        setActiveHref(getActiveHref());
        ticking = false;
      });
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("hashchange", updateActive);
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  return (
    <header className="portfolio-topbar">
      <a href="#top" className="portfolio-topbar__brand" aria-label="Kushagra Bharti">
        <span>KUSHAGRA</span>
        <span>BHARTI</span>
      </a>

      <nav className="portfolio-nav" aria-label="Portfolio navigation">
        <div className="portfolio-nav-links">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`portfolio-nav-link${activeHref === item.href ? " is-active" : ""}`}
              onClick={() => setActiveHref(item.href)}
            >
              {item.label}
            </a>
          ))}
        </div>
        <span className="portfolio-nav-dot" aria-hidden="true" />
      </nav>
    </header>
  );
};

export default PortfolioNavbar;
