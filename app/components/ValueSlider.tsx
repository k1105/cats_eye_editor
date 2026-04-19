"use client";

import React, {useEffect, useRef} from "react";

interface ValueSliderProps {
  hue: number;
  saturation: number;
  value: number; // 0-100
  onChange: (value: number) => void;
  width?: number;
  height?: number;
}

export const ValueSlider: React.FC<ValueSliderProps> = ({
  hue,
  saturation,
  value,
  onChange,
  width,
  height = 14,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateFromX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChangeRef.current(ratio * 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    updateFromX(e.clientX);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      updateFromX(e.clientX);
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

  const thumbSize = Math.round(height * 1.1);
  const thumbOffset = (thumbSize - height) / 2;

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "relative",
        width: width ?? "100%",
        height,
        borderRadius: height / 2,
        cursor: "pointer",
        background: `linear-gradient(to right, #000, hsl(${hue}, ${saturation}%, 50%))`,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `calc(${value}% - ${thumbSize / 2}px)`,
          top: -thumbOffset,
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 0 4px rgba(0, 0, 0, 0.35)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
