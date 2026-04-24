import React, { useEffect, useState } from "react";
import { fetchIntroSection, getCachedIntroSection } from "../../api/portfolioApi";
import { introBootstrap } from "../../generated/introBootstrap";
import type { PortfolioAiProvider, PortfolioIntroResponse } from "../../api/contracts";

const DEFAULT_SITE_URL = "https://www.kushagrabharti.com";

const heroLines: Array<{ text: string; isAccent?: boolean }> = [
  { text: "builder." },
  { text: "researcher." },
  { text: "filmmaker.", isAccent: true },
  { text: "tinkerer." },
];

const preferredSocialLabels = ["Email", "LinkedIn", "GitHub", "X", "Medium"];

const buildPrompt = (provider: PortfolioAiProvider, siteUrl: string) => {
  const hostname = new URL(siteUrl).hostname;
  return provider.promptTemplate
    .replace(/\{\{siteUrl\}\}/g, siteUrl)
    .replace(/\{\{hostname\}\}/g, hostname);
};

const buildActionHref = (hrefTemplate: string, prompt: string) =>
  hrefTemplate.replace("{{query}}", encodeURIComponent(prompt));

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

  const socialLinks = preferredSocialLabels
    .map((label) => introData.profile.socialLinks.find((link) => link.label === label))
    .filter((link): link is NonNullable<typeof link> => Boolean(link));

  const aiProviders = [...introData.ai.providers].sort((a, b) => a.order - b.order);

  const handleAiClick = (provider: PortfolioAiProvider) => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : DEFAULT_SITE_URL;
    const prompt = buildPrompt(provider, siteUrl);

    if (provider.action.type === "link") {
      window.open(buildActionHref(provider.action.hrefTemplate, prompt), "_blank", "noopener,noreferrer");
      return;
    }

    void navigator.clipboard.writeText(prompt);
    window.open(provider.action.targetUrl, "_blank", "noopener,noreferrer");
  };

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

          <div className="hero-landing__links" aria-label="Social and AI links">
            <div className="hero-landing__link-row">
              <span>Socials:</span>
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.label === "Email" ? undefined : "_blank"}
                  rel={link.label === "Email" ? undefined : "noreferrer"}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hero-landing__link-row">
              <span>Feeling Lazy?</span>
              {aiProviders.map((provider) => (
                <button
                  key={provider.slug}
                  type="button"
                  onClick={() => handleAiClick(provider)}
                  title={
                    provider.action.type === "clipboard"
                      ? `Copy prompt and open ${provider.label}`
                      : `Open ${provider.label} with portfolio prompt`
                  }
                >
                  {provider.label}
                </button>
              ))}
            </div>
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
