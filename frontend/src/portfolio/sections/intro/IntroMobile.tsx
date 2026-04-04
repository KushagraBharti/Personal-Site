import React from "react";
import GlassCard from "../../../shared/components/ui/GlassCard";
import IntroHero from "./IntroHero";
import type { IntroSectionData } from "./introTypes";

const IntroMobile: React.FC<{
  data: IntroSectionData;
  onCopied: () => void;
}> = ({ data, onCopied }) => (
  <div className="block md:hidden p-4 space-y-4">
    <GlassCard className="w-full text-center">
      <IntroHero
        name={data.profile.name}
        headline={data.profile.headline}
        socialLinks={data.profile.socialLinks}
        providers={data.ai.providers}
        onCopied={onCopied}
      />
    </GlassCard>

    <GlassCard className="w-full text-center p-4">
      <h4 className="text-sm font-bold text-white mb-1">Latest Update</h4>
      <p className="text-sm text-gray-200">{data.intro.latestUpdate}</p>
    </GlassCard>
    <GlassCard className="w-full text-center p-4">
      <h4 className="text-sm font-bold text-white mb-1">My Recent Read</h4>
      <a
        href={data.intro.featuredRead.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-200 hover:text-[#0A66C2]"
      >
        {data.intro.featuredRead.title}
      </a>
    </GlassCard>
    <GlassCard className="w-full text-center p-4">
      <h4 className="text-sm font-bold text-white mb-1">Fun Fact</h4>
      <p className="text-sm text-gray-200">{data.intro.funFact}</p>
    </GlassCard>
    <GlassCard className="w-full text-center p-4">
      <h4 className="text-sm font-bold text-white mb-1">Live GitHub Stats</h4>
      {data.githubStats ? (
        <p className="text-sm text-gray-200">
          <strong>Repositories:</strong> {data.githubStats.totalRepos}
          <br />
          <strong>Total Commits:</strong> {data.githubStats.totalCommits}
        </p>
      ) : (
        <p className="text-sm text-red-300">GitHub stats unavailable</p>
      )}
    </GlassCard>
  </div>
);

export default IntroMobile;
