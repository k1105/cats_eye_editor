"use client";

import React, {useState, useRef, useEffect} from "react";

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
  const gray = hexToGray(value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{position: "relative"}}>
      <div
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
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "12px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 100,
            width: "180px",
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
        </div>
      )}
    </div>
  );
};
