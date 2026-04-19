"use client";

import React, {useEffect, useRef} from "react";

interface HueRingProps {
  hue: number; // 0-360
  onChange: (hue: number) => void;
  size?: number;
  thickness?: number;
}

export const HueRing: React.FC<HueRingProps> = ({
  hue,
  onChange,
  size = 160,
  thickness = 24,
}) => {
  const ringRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const radius = size / 2;
  const innerRadius = radius - thickness;
  const center = radius;
  const indicatorRadius = (radius + innerRadius) / 2;

  const eventToHue = (clientX: number, clientY: number): number => {
    if (!ringRef.current) return hue;
    const rect = ringRef.current.getBoundingClientRect();
    const x = clientX - (rect.left + center);
    const y = clientY - (rect.top + center);
    const angleRad = Math.atan2(y, x);
    return ((angleRad * 180) / Math.PI + 90 + 360) % 360;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    onChangeRef.current(eventToHue(e.clientX, e.clientY));
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      onChangeRef.current(eventToHue(e.clientX, e.clientY));
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const hueRad = (hue * Math.PI) / 180;
  const indicatorX = center + indicatorRadius * Math.sin(hueRad);
  const indicatorY = center - indicatorRadius * Math.cos(hueRad);

  const ringMask = `radial-gradient(circle at center, transparent ${innerRadius - 0.5}px, black ${innerRadius}px, black ${radius - 0.5}px, transparent ${radius}px)`;

  return (
    <div
      ref={ringRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "relative",
        width: size,
        height: size,
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
          WebkitMaskImage: ringMask,
          maskImage: ringMask,
        }}
      />
      {(() => {
        const indicatorSize = Math.round(thickness * 1.1);
        return (
          <div
            style={{
              position: "absolute",
              left: indicatorX - indicatorSize / 2,
              top: indicatorY - indicatorSize / 2,
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 0 4px rgba(0, 0, 0, 0.35)",
              pointerEvents: "none",
            }}
          />
        );
      })()}
    </div>
  );
};
