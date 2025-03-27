// src/components/GlassButton.tsx
import React from "react";

interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassButton: React.FC<GlassButtonProps> = ({ children, className, onClick }) => {
  return (
    <button
      className={`btn-glass text-center ${className ? className : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default GlassButton;
