// src/components/ScrollProgress.tsx
import React, { useEffect, useRef, useState } from 'react';

const ScrollProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const lastValue = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      if (Math.abs(scrolled - lastValue.current) > 0.1) {
        lastValue.current = scrolled;
        setProgress(scrolled);
      }
      frame.current = null;
    };

    const handleScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(updateProgress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-50">
      <div
        className="h-full transition-all duration-200"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(45deg, #00d4ff, #00aaff)',
        }}
      />
    </div>
  );
};

export default ScrollProgress;
