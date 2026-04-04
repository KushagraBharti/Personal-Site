import React, { useEffect, useRef, useState } from "react";
import GlassCard from "../../../shared/components/ui/GlassCard";
import IntroDesktop from "./IntroDesktop";
import IntroMobile from "./IntroMobile";
import { DESKTOP_CARD_BASE_LAYER, type DesktopCardKey } from "./introLayout";
import { useIntroData } from "./useIntroData";

const IntroShellFallback: React.FC = () => (
  <section className="full-screen-bg intro-stage relative overflow-hidden">
    <div className="absolute inset-0 hidden items-center justify-center px-6 py-8 md:flex">
      <div className="intro-desktop-stage">
        <div className="intro-desktop-hero" style={{ width: 520, left: "50%", top: "50%", transform: "translate(-50%, -55%)" }}>
          <GlassCard className="flex flex-col items-center text-center p-10">
            <div className="h-14 w-72 rounded-full bg-white/10" />
            <div className="mt-5 h-6 w-56 rounded-full bg-white/10" />
            <div className="mt-8 flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/10" />
              <div className="h-6 w-6 rounded-full bg-white/10" />
              <div className="h-6 w-6 rounded-full bg-white/10" />
              <div className="h-6 w-6 rounded-full bg-white/10" />
              <div className="h-6 w-6 rounded-full bg-white/10" />
            </div>
            <div className="mt-8 flex gap-3">
              <div className="h-10 w-28 rounded-full bg-white/10" />
              <div className="h-10 w-44 rounded-full bg-white/10" />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>

    <div className="flex min-h-screen items-center justify-center px-4 md:hidden">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <div className="mx-auto h-10 w-40 rounded-full bg-white/10" />
        <div className="mx-auto mt-4 h-5 w-32 rounded-full bg-white/10" />
        <div className="mx-auto mt-8 h-48 w-48 rounded-3xl bg-white/10" />
      </GlassCard>
    </div>
  </section>
);

const IntroSection: React.FC<{
  onLiveWidgetsSettled?: () => void;
}> = ({ onLiveWidgetsSettled }) => {
  const { data, weather, liveWidgetsSettled } = useIntroData();
  const [isAtTop, setIsAtTop] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900
  );
  const [cardLayers, setCardLayers] =
    useState<Record<DesktopCardKey, number>>(DESKTOP_CARD_BASE_LAYER);
  const [copiedToast, setCopiedToast] = useState(false);
  const hasNotifiedLiveWidgetsRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY === 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const liftCard = (cardKey: DesktopCardKey) => {
    setCardLayers((currentLayers) => {
      const topLayer = Math.max(...Object.values(currentLayers));
      return {
        ...currentLayers,
        [cardKey]: topLayer + 1,
      };
    });
  };

  const handleCopied = () => {
    setCopiedToast(true);
    window.setTimeout(() => setCopiedToast(false), 3000);
  };

  useEffect(() => {
    if (!liveWidgetsSettled || hasNotifiedLiveWidgetsRef.current) {
      return;
    }

    hasNotifiedLiveWidgetsRef.current = true;
    onLiveWidgetsSettled?.();
  }, [liveWidgetsSettled, onLiveWidgetsSettled]);

  if (!data) {
    return <IntroShellFallback />;
  }

  return (
    <section className="full-screen-bg intro-stage relative overflow-hidden">
      <IntroDesktop
        data={data}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        cardLayers={cardLayers}
        onLift={liftCard}
        onCopied={handleCopied}
        weather={weather}
        isWeatherLoading={!weather}
      />
      <IntroMobile data={data} onCopied={handleCopied} />

      {isAtTop && (
        <div className="fixed bottom-4 w-full flex justify-center z-50 pointer-events-none">
          <p className="text-sm text-white/80 animate-bounce pointer-events-auto">Scroll for More</p>
        </div>
      )}

      {copiedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-fadeIn">
          <div className="glass rounded-full px-5 py-2.5 text-sm font-medium text-white/90 shadow-lg">
            Prompt copied - paste it into Gemini!
          </div>
        </div>
      )}
    </section>
  );
};

export default IntroSection;
