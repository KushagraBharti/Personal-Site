import React, { useRef } from "react";
import Draggable from "react-draggable";
import type { CardPosition, DesktopCardKey } from "./introLayout";

const IntroFloatingCard: React.FC<{
  cardKey: DesktopCardKey;
  defaultPosition: CardPosition;
  layer: number;
  onLift: (cardKey: DesktopCardKey) => void;
  children: React.ReactNode;
}> = ({ cardKey, defaultPosition, layer, onLift, children }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      bounds="parent"
      cancel="a, button"
      defaultPosition={defaultPosition}
      nodeRef={nodeRef}
      onStart={() => onLift(cardKey)}
    >
      <div
        ref={nodeRef}
        className="floating-card cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none", zIndex: layer }}
      >
        <div className="floating-card__surface">{children}</div>
      </div>
    </Draggable>
  );
};

export default IntroFloatingCard;
