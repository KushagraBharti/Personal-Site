import { useEffect, useState } from "react";
import {
  fetchGitHubStats,
  fetchWeather,
  getCachedGitHubStats,
  getCachedWeather,
} from "../../api/liveWidgetsApi";
import { fetchIntroSection, getCachedIntroSection } from "../../api/portfolioApi";
import { introBootstrap } from "../../generated/introBootstrap";
import type { IntroSectionData } from "./introTypes";

export const useIntroData = () => {
  const [data, setData] = useState<IntroSectionData | null>(() => {
    const cachedIntro = getCachedIntroSection() ?? introBootstrap;

    return {
      ...cachedIntro,
      githubStats: getCachedGitHubStats(),
    };
  });
  const [weather, setWeather] = useState(() => getCachedWeather());
  const [liveWidgetsSettled, setLiveWidgetsSettled] = useState(
    () => getCachedGitHubStats() !== null && getCachedWeather() !== null
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadIntro = async () => {
      try {
        const intro = await fetchIntroSection(controller.signal);
        setData((currentData) => ({
          ...intro,
          githubStats: currentData?.githubStats ?? getCachedGitHubStats(),
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load intro section data:", error);
        }
      }
    };

    const loadGitHubStats = fetchGitHubStats({
      signal: controller.signal,
      forceRefresh: true,
    })
      .then((githubStats) => {
        setData((currentData) => {
          if (!currentData) {
            return {
              ...introBootstrap,
              githubStats,
            };
          }

          return {
            ...currentData,
            githubStats,
          };
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load GitHub stats:", error);
        }
      });

    const loadWeatherData = fetchWeather(undefined, controller.signal)
      .then((nextWeather) => {
        setWeather(nextWeather);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load weather:", error);
        }
      });

    void loadIntro();
    void Promise.allSettled([loadGitHubStats, loadWeatherData]).then(() => {
      try {
        if (!controller.signal.aborted) {
          setLiveWidgetsSettled(true);
        }
      } catch {
        // Ignore state updates after teardown.
      }
    });

    return () => {
      controller.abort();
    };
  }, []);

  return {
    data,
    weather,
    liveWidgetsSettled,
  };
};
