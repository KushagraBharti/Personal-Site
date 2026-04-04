import React, { Suspense } from "react";
import GlassCard from "../../../shared/components/ui/GlassCard";
import WeatherCard from "../../components/WeatherCard";
import PongGame from "../../components/PongGame";
import IntroHero from "./IntroHero";
import IntroFloatingCard from "./IntroFloatingCard";
import { getDesktopStageLayout, type DesktopCardKey } from "./introLayout";
import type { IntroSectionData } from "./introTypes";
import type { WeatherData } from "../../api/contracts";

const IntroDesktop: React.FC<{
  data: IntroSectionData;
  viewportWidth: number;
  viewportHeight: number;
  cardLayers: Record<DesktopCardKey, number>;
  onLift: (cardKey: DesktopCardKey) => void;
  onCopied: () => void;
  weather: WeatherData | null;
  isWeatherLoading: boolean;
}> = ({ data, viewportWidth, viewportHeight, cardLayers, onLift, onCopied, weather, isWeatherLoading }) => {
  const desktopLayout = getDesktopStageLayout(viewportWidth, viewportHeight);
  const desktopLayoutKey = `${desktopLayout.stageWidth}x${desktopLayout.stageHeight}`;

  return (
    <div className="absolute inset-0 hidden items-center justify-center px-6 py-8 md:flex">
      <div className="intro-desktop-stage">
        <div
          className="intro-desktop-hero"
          style={{
            width: desktopLayout.hero.width,
            left: desktopLayout.hero.x,
            top: desktopLayout.hero.y,
          }}
        >
          <IntroHero
            name={data.profile.name}
            headline={data.profile.headline}
            socialLinks={data.profile.socialLinks}
            providers={data.ai.providers}
            onCopied={onCopied}
          />
        </div>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-photo`}
          cardKey="photo"
          defaultPosition={desktopLayout.cards.photo}
          layer={cardLayers.photo}
          onLift={onLift}
        >
          <GlassCard className="p-2 w-60 text-center flex flex-col items-center">
            <img
              src={data.intro.personalPhoto}
              alt={data.profile.name}
              className="rounded-lg object-cover w-60 h-64"
              decoding="async"
              draggable={false}
            />
            <p className="text-sm text-gray-200 mt-3">Drag Me Around!</p>
          </GlassCard>
        </IntroFloatingCard>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-latest`}
          cardKey="latest"
          defaultPosition={desktopLayout.cards.latest}
          layer={cardLayers.latest}
          onLift={onLift}
        >
          <GlassCard className="p-4 w-64 text-center">
            <h4 className="text-sm font-bold text-white mb-1">Latest Update</h4>
            <p className="text-sm text-gray-200">{data.intro.latestUpdate}</p>
          </GlassCard>
        </IntroFloatingCard>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-read`}
          cardKey="read"
          defaultPosition={desktopLayout.cards.read}
          layer={cardLayers.read}
          onLift={onLift}
        >
          <GlassCard className="p-4 w-60 text-center">
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
        </IntroFloatingCard>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-fact`}
          cardKey="fact"
          defaultPosition={desktopLayout.cards.fact}
          layer={cardLayers.fact}
          onLift={onLift}
        >
          <GlassCard className="p-4 w-64 text-center">
            <h4 className="text-sm font-bold text-white mb-1">Fun Fact</h4>
            <p className="text-sm text-gray-200">{data.intro.funFact}</p>
          </GlassCard>
        </IntroFloatingCard>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-pong`}
          cardKey="pong"
          defaultPosition={desktopLayout.cards.pong}
          layer={cardLayers.pong}
          onLift={onLift}
        >
          <GlassCard className="flex flex-col items-center p-8">
            <Suspense fallback={<div className="h-[180px] w-[275px] animate-pulse bg-black/30 rounded" />}>
              <PongGame />
            </Suspense>
          </GlassCard>
        </IntroFloatingCard>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-weather`}
          cardKey="weather"
          defaultPosition={desktopLayout.cards.weather}
          layer={cardLayers.weather}
          onLift={onLift}
        >
          <WeatherCard weather={weather} isLoading={isWeatherLoading} />
        </IntroFloatingCard>

        <IntroFloatingCard
          key={`${desktopLayoutKey}-github`}
          cardKey="github"
          defaultPosition={desktopLayout.cards.github}
          layer={cardLayers.github}
          onLift={onLift}
        >
          <GlassCard className="p-4 w-60 text-center">
            <h4 className="text-sm font-bold text-white mb-1">Live GitHub Stats</h4>
            {data.githubStats ? (
              <p className="text-sm text-gray-200">
                <strong>Repositories:</strong> {data.githubStats.totalRepos}
                <br />
                <strong>Total Commits:</strong> {data.githubStats.totalCommits}
              </p>
            ) : (
              <p className="text-sm text-gray-200">GitHub stats loading...</p>
            )}
          </GlassCard>
        </IntroFloatingCard>
      </div>
    </div>
  );
};

export default IntroDesktop;
