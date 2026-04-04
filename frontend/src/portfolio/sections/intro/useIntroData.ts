import { useEffect, useState } from "react";
import { fetchGitHubStats } from "../../api/liveWidgetsApi";
import { fetchIntroSection } from "../../api/portfolioApi";
import type { IntroSectionData } from "./introTypes";

export const useIntroData = () => {
  const [data, setData] = useState<IntroSectionData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const delayId = window.setTimeout(async () => {
      try {
        const [intro, githubStats] = await Promise.all([
          fetchIntroSection(controller.signal),
          fetchGitHubStats(controller.signal).catch(() => null),
        ]);
        setData({
          ...intro,
          githubStats,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load intro section data:", error);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(delayId);
    };
  }, []);

  return data;
};
