"use client";

import React, {useState, useRef, useEffect} from "react";
import {createPortal} from "react-dom";
import {hexToHsva, hsvaToHex} from "@uiw/color-convert";
import type {HsvaColor} from "@uiw/color-convert";
import {HueRing} from "./HueRing";
import {SaturationSlider} from "./SaturationSlider";
import {ValueSlider} from "./ValueSlider";

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
  const [popoverPos, setPopoverPos] = useState<{top: number; left: number; arrowY: number}>({
    top: 0,
    left: 0,
    arrowY: 130,
  });

  // valueプロップ変更時、現在のhsvaから生成した hex と一致するなら同期不要。
  // （sat=0 や value=0 で hex に丸めると hue 情報が失われ、hexToHsva で hue=0 に
  //   リセットされる現象を避ける）
  useEffect(() => {
    if (hsvaToHex(hsva).toLowerCase() !== value.toLowerCase()) {
      setHsva(hexToHsva(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // 吹き出しの先端は chip 中央を指す → popover 内の Y 座標を計算してクランプ
      const arrowYRaw = desiredTop - clampedTop + POPOVER_HEIGHT / 2;
      const arrowY = Math.max(24, Math.min(POPOVER_HEIGHT - 24, arrowYRaw));
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
            <HueRing
              hue={hsva.h}
              size={160}
              thickness={22}
              onChange={(h) => handleChange({...hsva, h})}
            />
            <SaturationSlider
              hue={hsva.h}
              saturation={hsva.s}
              value={hsva.v}
              width={160}
              onChange={(s) => handleChange({...hsva, s})}
            />
            <ValueSlider
              hue={hsva.h}
              saturation={hsva.s}
              value={hsva.v}
              width={160}
              onChange={(v) => handleChange({...hsva, v})}
            />
            {/* 吹き出しの三角（chip方向 = 右側）。popoverのbox-shadowに合わせて drop-shadow */}
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
