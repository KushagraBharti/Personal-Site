// src/components/GlassButton.tsx

import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  type = "button",
  ...rest
}) => {
  return (
    <button
      className={`btn-glass text-center ${className ? className : ""}`}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
};

export default GlassButton;
