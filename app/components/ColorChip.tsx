"use client";

import React, {useState, useRef, useEffect} from "react";
import Wheel from "@uiw/react-color-wheel";
import ShadeSlider from "@uiw/react-color-shade-slider";
import {hexToHsva, hsvaToHex} from "@uiw/color-convert";
import type {HsvaColor} from "@uiw/color-convert";

interface ColorChipProps {
  value: string;
  onChange: (value: string) => void;
  active?: boolean;
  onSelect?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const ColorChip: React.FC<ColorChipProps> = ({value, onChange, active, onSelect, onOpenChange}) => {
  const [open, setOpen] = useState(false);
  const [hsva, setHsva] = useState<HsvaColor>(() => hexToHsva(value));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHsva(hexToHsva(value));
  }, [value]);

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenAndNotify(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleChange = (newHsva: HsvaColor) => {
    setHsva(newHsva);
    onChange(hsvaToHex(newHsva));
  };

  const handleClick = () => {
    if (onSelect && !active) {
      onSelect();
    } else {
      setOpenAndNotify(!open);
    }
  };

  return (
    <div ref={ref} style={{position: "relative"}}>
      <div
        onClick={handleClick}
        className="cursor-pointer"
        style={{
          width: "29px",
          height: "29px",
          flexShrink: 0,
          borderRadius: "50%",
          overflow: "visible",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: active ? "2.5px solid white" : "none",
          outlineOffset: "2px",
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
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#222",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Wheel
            color={hsva}
            width={160}
            height={160}
            onChange={(color) => handleChange({...color.hsva})}
          />
          <ShadeSlider
            hsva={hsva}
            style={{width: 160}}
            onChange={(newShade) => handleChange({...hsva, ...newShade})}
          />
        </div>
      )}
    </div>
  );
};
