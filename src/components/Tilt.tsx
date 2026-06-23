"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

interface TiltProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees at the edge of the element. */
  max?: number;
}

/**
 * Wraps content in a panel that tilts toward the cursor, giving flat glass
 * cards real perspective. Respects prefers-reduced-motion by simply never
 * rotating for users who've asked for less motion.
 */
export function Tilt({ children, className = "", max = 8 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  function reducedMotion() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (reducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;

    setStyle({ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` });
  }

  function handleMouseLeave() {
    setStyle({ transform: "rotateX(0deg) rotateY(0deg)" });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        ...style
      }}
    >
      {children}
    </div>
  );
}
