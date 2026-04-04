import React from "react";
import Tilt from "react-parallax-tilt";
import { FaEnvelope, FaGithub, FaLinkedin, FaMediumM } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import GlassCard from "../../../shared/components/ui/GlassCard";
import type { PortfolioSocialLink } from "../../api/contracts";
import IntroAiButtons from "./IntroAiButtons";

const socialIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  email: FaEnvelope,
  linkedin: FaLinkedin,
  github: FaGithub,
  medium: FaMediumM,
  x: FaXTwitter,
};

const hoverColors: Record<string, string> = {
  email: "hover:text-[#D44638]",
  linkedin: "hover:text-[#0A66C2]",
  github: "hover:text-[#6e40c9]",
  medium: "hover:text-[#00ab6c]",
  x: "hover:text-black",
};

const IntroHero: React.FC<{
  name: string;
  headline: string;
  socialLinks: PortfolioSocialLink[];
  providers: React.ComponentProps<typeof IntroAiButtons>["providers"];
  onCopied: () => void;
}> = ({ name, headline, socialLinks, providers, onCopied }) => (
  <Tilt
    tiltMaxAngleX={15}
    tiltMaxAngleY={15}
    perspective={800}
    scale={1.05}
    transitionSpeed={2500}
    className="w-full"
  >
    <GlassCard className="flex flex-col items-center text-center p-10">
      <h1 className="text-5xl md:text-6xl font-playfair mb-4">{name}</h1>
      <p className="text-lg font-mono mb-6">{headline}</p>
      <div className="flex justify-center space-x-6 mb-6">
        {socialLinks.map((link) => {
          const key = link.label.toLowerCase();
          const Icon = socialIcons[key];
          if (!Icon) return null;

          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-transform duration-300 hover:scale-110 ${hoverColors[key] ?? ""}`}
              aria-label={link.label}
            >
              <Icon size={24} />
            </a>
          );
        })}
      </div>
      <div className="flex justify-center items-stretch gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 hover:bg-white/[0.06] cursor-pointer"
          onClick={() =>
            window.scrollTo({
              top: window.innerHeight,
              behavior: "smooth",
            })
          }
        >
          Explore
        </button>
        <IntroAiButtons providers={providers} onCopied={onCopied} />
      </div>
    </GlassCard>
  </Tilt>
);

export default IntroHero;
