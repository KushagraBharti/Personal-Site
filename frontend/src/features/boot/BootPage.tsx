import React, { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BootSequence from "./BootSequence";
import { useTheme } from "../../app/providers/ThemeProvider";

export const BOOT_SESSION_KEY = "portfolio-os::session-booted";
export const BOOT_TUTORIAL_VERSION = 1;

const BootPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { skipBoot, bootHintsVersion, setBootHintsVersion } = useTheme();
  const initialSkip = useRef(skipBoot);

  const params = new URLSearchParams(location.search);
  const redirectTarget = params.get("next") ? decodeURIComponent(params.get("next") ?? "/") : "/";

  const handleTutorialComplete = useCallback(() => {
    setBootHintsVersion(BOOT_TUTORIAL_VERSION);
  }, [setBootHintsVersion]);

  const completeSequence = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BOOT_SESSION_KEY, "1");
    }
    navigate(redirectTarget || "/", { replace: true });
  }, [navigate, redirectTarget]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!initialSkip.current) return;
    handleTutorialComplete();
    completeSequence();
  }, [completeSequence, handleTutorialComplete]);

  const shouldShowTutorial = bootHintsVersion < BOOT_TUTORIAL_VERSION;

  return (
    <BootSequence
      shouldShowTutorial={shouldShowTutorial}
      onTutorialComplete={handleTutorialComplete}
      onSequenceComplete={completeSequence}
    />
  );
};

export default BootPage;
