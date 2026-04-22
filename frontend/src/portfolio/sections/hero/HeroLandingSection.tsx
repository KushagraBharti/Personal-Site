import React, { useEffect, useState } from "react";
import { fetchIntroSection, getCachedIntroSection } from "../../api/portfolioApi";
import { introBootstrap } from "../../generated/introBootstrap";
import type { PortfolioIntroResponse } from "../../api/contracts";

const heroLines: Array<{ text: string; isAccent?: boolean }> = [
  { text: "builder." },
  { text: "researcher." },
  { text: "filmmaker.", isAccent: true },
  { text: "tinkerer." },
];

const HeroLandingSection: React.FC = () => {
  const [introData, setIntroData] = useState<PortfolioIntroResponse>(
    () => getCachedIntroSection() ?? introBootstrap
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadIntro = async () => {
      try {
        const response = await fetchIntroSection(controller.signal);
        setIntroData(response);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load hero intro data:", error);
        }
      }
    };

    void loadIntro();

    return () => controller.abort();
  }, []);

  return (
    <section id="top" className="hero-landing" aria-label={`${introData.profile.name} landing section`}>
      <div className="hero-landing__grid">
        <div className="hero-landing__copy">
          <div className="hero-landing__headline" aria-label="Hero roles">
            {heroLines.map((line) => (
              <p
                key={line.text}
                className={`hero-landing__headline-line${line.isAccent ? " is-accent" : ""}`}
              >
                {line.text}
              </p>
            ))}
          </div>

          <p className="hero-landing__summary">
            I build systems at the
            <br />
            intersection of AI, data,
            <br />
            and real-world impact.
          </p>

          <div className="hero-landing__sound">
            <span>SOUND</span>
            <button type="button" className="is-active">
              ON
            </button>
            <span>/</span>
            <button type="button">OFF</button>
          </div>
        </div>

        <div className="hero-landing__visual" aria-label="Portrait placeholder">
          <div className="hero-landing__ring hero-landing__ring--outer" />
          <div className="hero-landing__ring hero-landing__ring--inner" />
          <div className="hero-landing__dust hero-landing__dust--one" />
          <div className="hero-landing__dust hero-landing__dust--two" />
          <div className="hero-landing__portrait-placeholder">
            <div className="hero-landing__portrait-figure" />
            <span>portrait placeholder</span>
          </div>
          <div className="hero-landing__coordinates">30.2672 N, 85.2708 E</div>
        </div>
      </div>
    </section>
  );
};

export default HeroLandingSection;
