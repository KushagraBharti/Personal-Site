// src/components/CustomCursor.tsx
import React, { useEffect, useState } from "react";

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 w-4 h-4 rounded-full bg-primary transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    />
  );
};

export default CustomCursor;
