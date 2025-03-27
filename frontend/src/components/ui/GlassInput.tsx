// src/components/GlassInput.tsx
import React from "react";

interface GlassInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const GlassInput: React.FC<GlassInputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  className,
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`glass px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary ${className || ""}`}
    />
  );
};

export default GlassInput;
