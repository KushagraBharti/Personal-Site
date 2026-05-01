import React, { useEffect, useState } from "react";
import { introBootstrap } from "../../generated/introBootstrap";
import type {
  PortfolioAiProvider,
  PortfolioIntroResponse,
} from "../../api/contracts";

type SculptureSceneComponent = React.ComponentType;

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

const canCreateWebGLContext = () => {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
    };
    const context =
      canvas.getContext("webgl2", attributes) ??
      canvas.getContext("webgl", attributes);

    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
};

const HeroLandingSection: React.FC = () => {
  const [introData, setIntroData] = useState<PortfolioIntroResponse>(
    () => introBootstrap,
  );
  const [clipboardProvider, setClipboardProvider] =
    useState<PortfolioAiProvider | null>(null);
  const [SculptureScene, setSculptureScene] =
    useState<SculptureSceneComponent | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadIntro = async () => {
      try {
        const { fetchIntroSection, getCachedIntroSection } =
          await import("../../api/portfolioApi");
        const cachedIntro = getCachedIntroSection();
        if (cachedIntro) {
          setIntroData(cachedIntro);
        }
        const response = await fetchIntroSection(controller.signal);
        setIntroData(response);
      } catch {
        if (!controller.signal.aborted) {
          // Keep the generated hero bootstrap if the live API is unavailable.
        }
      }
    };

    void loadIntro();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!canCreateWebGLContext()) {
      return () => {
        isMounted = false;
      };
    }

    void import("./SculptureScene")
      .then((module) => {
        if (isMounted) {
          setSculptureScene(() => module.default);
        }
      })
      .catch(() => {
        // Keep the hero usable if the GPU-backed scene cannot be loaded.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!clipboardProvider) return;

    const timeoutId = window.setTimeout(() => {
      setClipboardProvider(null);
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [clipboardProvider]);

  const socialLinks = preferredSocialLabels
    .map((label) =>
      introData.profile.socialLinks.find((link) => link.label === label),
    )
    .filter((link): link is NonNullable<typeof link> => Boolean(link));

  const aiProviders = [...introData.ai.providers].sort(
    (a, b) => a.order - b.order,
  );

  const handleAiClick = (provider: PortfolioAiProvider) => {
    const siteUrl =
      typeof window !== "undefined" ? window.location.origin : DEFAULT_SITE_URL;
    const prompt = buildPrompt(provider, siteUrl);

    if (provider.action.type === "link") {
      window.open(
        buildActionHref(provider.action.hrefTemplate, prompt),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    void navigator.clipboard.writeText(prompt).catch((error) => {
      console.error(`Failed to copy ${provider.label} prompt:`, error);
    });
    setClipboardProvider(provider);
    if (provider.action.targetUrl) {
      window.open(provider.action.targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      id="top"
      className="hero-landing"
      aria-label={`${introData.profile.name} landing section`}
    >
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
            I build systems at the intersection of AI, data, and real-world
            impact.
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

        {clipboardProvider ? (
          <div className="hero-ai-modal" role="status" aria-live="polite">
            <div className="hero-ai-modal__panel">
              <div className="hero-ai-modal__copy">
                <div className="hero-ai-modal__header">
                  <span className="hero-ai-modal__mark" aria-hidden="true">
                    {clipboardProvider.label.slice(0, 1)}
                  </span>
                  <p className="hero-ai-modal__eyebrow">Prompt copied</p>
                </div>
                <h2>Gemini needs a manual paste.</h2>
                <p>
                  {clipboardProvider.action.type === "clipboard" &&
                  clipboardProvider.action.message
                    ? clipboardProvider.action.message
                    : `${clipboardProvider.label} does not support pre-filled prompt links reliably, so the prompt has been copied to your clipboard.`}
                </p>
                <div className="hero-ai-modal__actions">
                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open gemini.google.com
                  </a>
                  <span>then paste the copied prompt.</span>
                </div>
              </div>
              <button
                type="button"
                className="hero-ai-modal__close"
                onClick={() => setClipboardProvider(null)}
                aria-label="Close Gemini prompt notice"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

        <div
          className="hero-landing__visual"
          aria-label="3D Portrait Sculpture"
        >
          <div className="hero-landing__ring hero-landing__ring--outer" />
          <div className="hero-landing__ring hero-landing__ring--inner" />
          <div className="hero-landing__dust hero-landing__dust--one" />
          <div className="hero-landing__dust hero-landing__dust--two" />
          <div className="hero-landing__scene">
            {SculptureScene ? <SculptureScene /> : null}
          </div>
          <p className="hero-landing__model-note">
            this 3d model is a work in progress, quality will become better LOL
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroLandingSection;
