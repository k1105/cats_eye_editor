"use client";

import React, {useState, useRef, useEffect} from "react";
import {createPortal} from "react-dom";

interface GrayscaleChipProps {
  value: string; // hex like "#e6e6e6"
  onChange: (value: string) => void;
}

const hexToGray = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  return Math.round(r);
};

const grayToHex = (g: number): string => {
  const h = g.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
};

export const GrayscaleChip: React.FC<GrayscaleChipProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    arrowY: number;
  }>({
    top: 0,
    left: 0,
    arrowY: 40,
  });
  const gray = hexToGray(value);
  const grayRatio = gray / 255;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateFromX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChangeRef.current(grayToHex(Math.round(ratio * 255)));
  };

  const handleTrackMouseDown = (e: React.MouseEvent) => {
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

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open || !chipRef.current) return;
    const update = () => {
      const chipRect = chipRef.current!.getBoundingClientRect();
      const panelEl = document.querySelector(".edit-panel");
      const panelRect = panelEl?.getBoundingClientRect();
      const baseLeft = panelRect ? panelRect.left : chipRect.left;
      const margin = 16;
      const POPOVER_HEIGHT = 48;
      const desiredTop = chipRect.top + chipRect.height / 2;
      const minTop = POPOVER_HEIGHT / 2 + margin;
      const maxTop = window.innerHeight - POPOVER_HEIGHT / 2 - margin;
      const clampedTop =
        maxTop < minTop
          ? window.innerHeight / 2
          : Math.max(minTop, Math.min(maxTop, desiredTop));
      const arrowYRaw = desiredTop - clampedTop + POPOVER_HEIGHT / 2;
      const arrowY = Math.max(20, Math.min(POPOVER_HEIGHT - 20, arrowYRaw));
      setPopoverPos({top: clampedTop, left: baseLeft, arrowY});
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div ref={ref} style={{position: "relative"}}>
      <div
        ref={chipRef}
        onClick={() => setOpen(!open)}
        className="cursor-pointer"
        style={{
          width: "29px",
          height: "29px",
          flexShrink: 0,
          borderRadius: "50%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "calc(100% - 2px)",
            height: "calc(100% - 2px)",
            borderRadius: "50%",
            backgroundColor: value,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "1px solid black",
            pointerEvents: "none",
          }}
        />
      </div>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
              transform: "translate(calc(-100% + 12px), -50%)",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "16px 18px",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
              zIndex: 300,
              width: "200px",
            }}
          >
            <div
              ref={trackRef}
              onMouseDown={handleTrackMouseDown}
              style={{
                position: "relative",
                width: "100%",
                height: 14,
                borderRadius: 7,
                cursor: "pointer",
                background: "linear-gradient(to right, #000, #fff)",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `calc(${grayRatio * 100}% - 8px)`,
                  top: -1,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 0 4px rgba(0, 0, 0, 0.35)",
                  pointerEvents: "none",
                }}
              />
            </div>
            {/* 吹き出しの三角 */}
            <div
              style={{
                position: "absolute",
                right: -11,
                top: popoverPos.arrowY - 12,
                width: 12,
                height: 24,
                background: "white",
                clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                pointerEvents: "none",
                filter: "drop-shadow(2px 0 3px rgba(0, 0, 0, 0.10))",
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
