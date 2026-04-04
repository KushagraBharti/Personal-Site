// frontend/src/components/ui/GlassCard.tsx

import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, style, onClick }) => {
  return (
    <div
      className={`card glass ${className ? className : ""}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
