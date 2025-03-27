// src/components/AnimatedGlassCard.tsx
import React from "react";
import { motion } from "framer-motion";

interface AnimatedGlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const AnimatedGlassCard: React.FC<AnimatedGlassCardProps> = ({ children, className, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card glass ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedGlassCard;
