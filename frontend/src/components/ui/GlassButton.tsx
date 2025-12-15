// src/components/GlassButton.tsx
import React from "react";

interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const GlassButton: React.FC<GlassButtonProps> = ({ children, className, onClick, type = "button" }) => {
  return (
    <button
      className={`btn-glass text-center ${className ? className : ""}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default GlassButton;
