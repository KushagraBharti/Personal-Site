import React, { useEffect, useRef } from "react";

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestPointRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const updateCursorPosition = () => {
      const { x, y } = latestPointRef.current;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frameRef.current = null;
    };

    const moveCursor = (e: MouseEvent) => {
      latestPointRef.current = { x: e.clientX, y: e.clientY };
      cursor.classList.add("is-visible");
      const target = e.target as HTMLElement | null;
      cursor.classList.toggle(
        "is-interactive",
        Boolean(
          target?.closest(
            "a, button, [role='button'], input, textarea, select, [data-custom-cursor='interactive']",
          ),
        )
      );
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateCursorPosition);
      }
    };

    const hideCursor = () => cursor.classList.remove("is-visible");

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseleave", hideCursor);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
};

export default CustomCursor;
