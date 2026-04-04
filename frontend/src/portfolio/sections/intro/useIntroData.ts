import { useEffect, useState } from "react";
import { fetchGitHubStats, getCachedGitHubStats } from "../../api/liveWidgetsApi";
import { fetchIntroSection, getCachedIntroSection } from "../../api/portfolioApi";
import type { IntroSectionData } from "./introTypes";

export const useIntroData = () => {
  const [data, setData] = useState<IntroSectionData | null>(() => {
    const cachedIntro = getCachedIntroSection();
    if (!cachedIntro) return null;

    return {
      ...cachedIntro,
      githubStats: getCachedGitHubStats(),
    };
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadIntro = async () => {
      try {
        const intro = await fetchIntroSection(controller.signal);
        setData({
          ...intro,
          githubStats: getCachedGitHubStats(),
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load intro section data:", error);
        }
      }
    };

    const loadGitHubStats = async () => {
      try {
        const githubStats = await fetchGitHubStats(controller.signal);
        setData((currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            githubStats,
          };
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load GitHub stats:", error);
        }
      }
    };

    void loadIntro();
    void loadGitHubStats();

    return () => {
      controller.abort();
    };
  }, []);

  return data;
};
