import React, { useEffect, useState } from "react";
import IntroDesktop from "./IntroDesktop";
import IntroMobile from "./IntroMobile";
import { DESKTOP_CARD_BASE_LAYER, type DesktopCardKey } from "./introLayout";
import { useIntroData } from "./useIntroData";

const IntroSection: React.FC = () => {
  const data = useIntroData();
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

  if (!data) {
    return (
      <section className="full-screen-bg intro-stage relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass rounded-3xl px-8 py-6 text-white/90 shadow-lg">
            Loading intro...
          </div>
        </div>
      </section>
    );
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
