import React from "react";

type ResizeDirection =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

interface ResizersProps {
  onPointerResize: (direction: ResizeDirection, event: React.PointerEvent<HTMLDivElement>) => void;
  onMouseResize: (direction: ResizeDirection, event: React.MouseEvent<HTMLDivElement>) => void;
  onTouchResize: (direction: ResizeDirection, event: React.TouchEvent<HTMLDivElement>) => void;
}

const RESIZER_CONFIG: Array<{ direction: ResizeDirection; className: string; cursor: string }> = [
  { direction: "top", className: "inset-x-2 top-0 h-2", cursor: "n-resize" },
  { direction: "bottom", className: "inset-x-2 bottom-0 h-2", cursor: "s-resize" },
  { direction: "left", className: "inset-y-2 left-0 w-2", cursor: "w-resize" },
  { direction: "right", className: "inset-y-2 right-0 w-2", cursor: "e-resize" },
  {
    direction: "topLeft",
    className: "left-0 top-0 h-3 w-3",
    cursor: "nw-resize",
  },
  {
    direction: "topRight",
    className: "right-0 top-0 h-3 w-3",
    cursor: "ne-resize",
  },
  {
    direction: "bottomLeft",
    className: "bottom-0 left-0 h-3 w-3",
    cursor: "sw-resize",
  },
  {
    direction: "bottomRight",
    className: "bottom-0 right-0 h-3 w-3",
    cursor: "se-resize",
  },
];

const Resizers: React.FC<ResizersProps> = ({ onPointerResize, onMouseResize, onTouchResize }) => {
  return (
    <>
      {RESIZER_CONFIG.map(({ direction, className, cursor }) => (
        <div
          key={direction}
          className={`absolute ${className} touch-none`}
          style={{ cursor }}
          onPointerDown={(event) => onPointerResize(direction, event)}
          onMouseDown={(event) => onMouseResize(direction, event)}
          onTouchStart={(event) => onTouchResize(direction, event)}
        />
      ))}
    </>
  );
};

export type { ResizeDirection };
export default Resizers;

