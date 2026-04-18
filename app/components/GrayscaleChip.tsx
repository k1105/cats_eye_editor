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

export const GrayscaleChip: React.FC<GrayscaleChipProps> = ({value, onChange}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{top: number; left: number}>({top: 0, left: 0});
  const gray = hexToGray(value);

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
      const POPOVER_HEIGHT = 80;
      const desiredTop = chipRect.top + chipRect.height / 2;
      const minTop = POPOVER_HEIGHT / 2 + margin;
      const maxTop = window.innerHeight - POPOVER_HEIGHT / 2 - margin;
      const clampedTop =
        maxTop < minTop ? window.innerHeight / 2 : Math.max(minTop, Math.min(maxTop, desiredTop));
      setPopoverPos({top: clampedTop, left: baseLeft});
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
            border: "1px solid white",
            mixBlendMode: "difference",
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
              transform: "translate(calc(-100% - 16px), -50%)",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "16px 18px",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
              zIndex: 300,
              width: "200px",
            }}
          >
          <input
            type="range"
            min={0}
            max={255}
            value={gray}
            onChange={(e) => onChange(grayToHex(Number(e.target.value)))}
            style={{
              width: "100%",
              accentColor: "#888",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "#999",
              marginTop: "2px",
            }}
          >
            <span>黒</span>
            <span style={{fontFamily: "monospace"}}>{value}</span>
            <span>白</span>
          </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
