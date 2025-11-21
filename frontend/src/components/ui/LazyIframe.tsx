import React, { useEffect, useRef, useState } from "react";

interface LazyIframeProps {
  src: string;
  title: string;
  className?: string;
  allow?: string;
  allowFullScreen?: boolean;
  loadingLabel?: string;
}

const LazyIframe: React.FC<LazyIframeProps> = ({
  src,
  title,
  className = "",
  allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
  allowFullScreen = true,
  loadingLabel = "Loading content...",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        <iframe className="w-full h-full" src={src} title={title} allow={allow} allowFullScreen={allowFullScreen} />
      ) : (
        <div className="w-full h-full bg-black/50 flex items-center justify-center text-white/70 animate-pulse">
          {loadingLabel}
        </div>
      )}
    </div>
  );
};

export default LazyIframe;
