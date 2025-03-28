// src/components/ScrollProgress.tsx
import React, { useState, useEffect } from 'react';

const ScrollProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
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
