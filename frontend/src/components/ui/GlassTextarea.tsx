// src/components/GlassTextarea.tsx

import React from "react";

interface GlassTextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

const GlassTextarea: React.FC<GlassTextareaProps> = ({
  placeholder,
  value,
  onChange,
  className,
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`glass px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary ${className || ""}`}
    />
  );
};

export default GlassTextarea;
