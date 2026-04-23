"use client";

import {useState, useEffect, useRef} from "react";
import {useLadybug} from "./LadybugAnimation";

const MESSAGE = "Editing is available on desktop only.";
const OFFSET = 20;

export function LadybugTrailText() {
  const {position, isActive} = useLadybug();
  const [isMobile, setIsMobile] = useState(false);
  const [angle, setAngle] = useState(0);
  const prevPosRef = useRef<{x: number; y: number} | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isActive) {
      prevPosRef.current = null;
      return;
    }
    if (position && prevPosRef.current) {
      const dx = position.x - prevPosRef.current.x;
      const dy = position.y - prevPosRef.current.y;
      if (dx !== 0 || dy !== 0) {
        setAngle((Math.atan2(dy, dx) * 180) / Math.PI);
      }
    }
    prevPosRef.current = position;
  }, [position, isActive]);

  if (!isMobile || !position || !isActive) return null;

  // 180°回転で上下反転する向きの場合は、テキスト自体を180°反転して読める向きに
  const normalized = ((angle % 360) + 360) % 360;
  const flip = normalized > 90 && normalized < 270;
  const textRotation = flip ? 180 : 0;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 0",
        pointerEvents: "none",
        zIndex: 9998,
        width: 0,
        height: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          right: flip ? "auto" : `${OFFSET}px`,
          left: flip ? `${OFFSET}px` : "auto",
          top: "-0.6em",
          whiteSpace: "nowrap",
          fontSize: "12px",
          color: "#fff",
          mixBlendMode: "difference",
          transform: `rotate(${textRotation}deg)`,
        }}
      >
        {MESSAGE}
      </span>
    </div>
  );
}
