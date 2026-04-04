import React from "react";
import { SiClaude, SiGooglegemini, SiOpenai } from "react-icons/si";
import type { PortfolioAiProvider } from "../../api/contracts";

const DEFAULT_SITE_URL = "https://www.kushagrabharti.com";

const providerIcons = {
  openai: SiOpenai,
  claude: SiClaude,
  gemini: SiGooglegemini,
} as const;

const buildPrompt = (provider: PortfolioAiProvider, siteUrl: string) => {
  const hostname = new URL(siteUrl).hostname;
  return provider.promptTemplate
    .replace(/\{\{siteUrl\}\}/g, siteUrl)
    .replace(/\{\{hostname\}\}/g, hostname);
};

const buildActionHref = (hrefTemplate: string, prompt: string) =>
  hrefTemplate.replace("{{query}}", encodeURIComponent(prompt));

const IntroAiButtons: React.FC<{
  providers: PortfolioAiProvider[];
  onCopied: () => void;
}> = ({ providers, onCopied }) => {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : DEFAULT_SITE_URL;

  const handleClick = (provider: PortfolioAiProvider) => {
    const prompt = buildPrompt(provider, siteUrl);
    if (provider.action.type === "link") {
      window.open(buildActionHref(provider.action.hrefTemplate, prompt), "_blank", "noopener,noreferrer");
      return;
    }

    navigator.clipboard.writeText(prompt).then(() => onCopied());
    window.open(provider.action.targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="inline-flex items-center gap-3.5 rounded-full border border-white/15 px-3.5 py-2 transition-colors duration-200 hover:bg-white/[0.06]">
      <span className="text-xs font-semibold tracking-wider uppercase opacity-50 select-none">
        Ask AI
      </span>
      {providers.map((provider) => {
        const Icon = providerIcons[provider.icon];
        return (
          <button
            key={provider.slug}
            type="button"
            onClick={() => handleClick(provider)}
            className={`text-white/70 transition-transform duration-300 hover:scale-110 hover:text-inherit cursor-pointer ${provider.hoverColorClass}`}
            aria-label={`Summarize via ${provider.label}`}
            title={
              provider.action.type === "clipboard"
                ? `Copy prompt & open ${provider.label}`
                : `Summarize via ${provider.label}`
            }
          >
            <Icon size={22} />
          </button>
        );
      })}
    </div>
  );
};

export default IntroAiButtons;
