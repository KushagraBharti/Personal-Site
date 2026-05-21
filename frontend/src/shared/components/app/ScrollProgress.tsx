import React, { useEffect, useRef } from "react";

const ScrollProgress: React.FC = () => {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const lastValue = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      const progressBar = progressRef.current;
      if (!progressBar) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollableHeight = Math.max(scrollHeight - clientHeight, 1);
      const scrolled = (scrollTop / scrollableHeight) * 100;
      if (Math.abs(scrolled - lastValue.current) > 0.1) {
        lastValue.current = scrolled;
        progressBar.style.transform = `scaleX(${
          Math.max(0, Math.min(scrolled, 100)) / 100
        })`;
      }
      frame.current = null;
    };

    const handleScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(updateProgress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-50">
      <div
        ref={progressRef}
        className="h-full w-full origin-left transition-transform duration-200"
        style={{
          transform: "scaleX(0)",
          background: "linear-gradient(45deg, #00d4ff, #00aaff)",
        }}
      />
    </div>
  );
};

export default ScrollProgress;
