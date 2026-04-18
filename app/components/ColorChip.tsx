"use client";

import React, {useState, useRef, useEffect} from "react";
import {createPortal} from "react-dom";
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
  const chipRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{top: number; left: number}>({top: 0, left: 0});

  useEffect(() => {
    setHsva(hexToHsva(value));
  }, [value]);

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next);
  };

  // open状態の親通知をエフェクトで管理（cleanupでアンマウント時もfalse通知が飛ぶ）
  useEffect(() => {
    if (!open) return;
    onOpenChange?.(true);
    return () => onOpenChange?.(false);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpenAndNotify(false);
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
      const POPOVER_HEIGHT = 260;
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
        ref={chipRef}
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
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
              zIndex: 300,
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
          </div>,
          document.body,
        )}
    </div>
  );
};
