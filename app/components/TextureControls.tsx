import React from "react";
import type {TextureSettings} from "../types";
import {ColorChip} from "./ColorChip";

interface TextureControlsProps {
  textureSettings: TextureSettings;
  updateTextureSetting: <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => void;
  paletteColors: string[];
  onReplacePaletteColor: (oldColor: string, newColor: string) => void;
  onPickerOpenChange?: (open: boolean) => void;
  vertical?: boolean;
}

const labelStyle: React.CSSProperties = {
  color: "#231616",
  whiteSpace: "nowrap",
  fontSize: "13px",
  fontWeight: 400,
};

const sliderLabelStyle: React.CSSProperties = {
  ...labelStyle,
  display: "inline-block",
  minWidth: "var(--grid-col)",
};

export const TextureControls: React.FC<TextureControlsProps> = ({
  textureSettings,
  updateTextureSetting,
  paletteColors,
  onReplacePaletteColor,
  onPickerOpenChange,
  vertical: _vertical = false,
}) => {
  const handlePaletteColorChange = (oldColor: string, newColor: string) => {
    if (oldColor === newColor) return;
    // 他のパレット色と一致するとマージしてチップが消えるため、
    // 1bitだけずらしてユニーク化する
    const offsetBlue = (hex: string): string => {
      const b = parseInt(hex.slice(5, 7), 16);
      const newB = b === 255 ? b - 1 : b + 1;
      return hex.slice(0, 5) + newB.toString(16).padStart(2, "0");
    };
    const norm = (c: string) => c.toLowerCase();
    const others = paletteColors.filter((c) => norm(c) !== norm(oldColor));
    let safeColor = newColor;
    let attempts = 0;
    while (
      attempts < 16 &&
      others.some((c) => norm(c) === norm(safeColor))
    ) {
      safeColor = offsetBlue(safeColor);
      attempts++;
    }
    onReplacePaletteColor(oldColor, safeColor);
    updateTextureSetting("brushColor", safeColor);
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const sliderHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  };

  const indicatorPlaceholder: React.CSSProperties = {
    width: "20px",
    height: "16px",
    background: "#eee",
    borderRadius: "2px",
    flexShrink: 0,
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
      {/* Background / Brush Color */}
      <div style={rowStyle}>
        <label style={labelStyle}>Background</label>
        <ColorChip
          value={textureSettings.backgroundColor}
          onChange={(color) => updateTextureSetting("backgroundColor", color)}
          onOpenChange={onPickerOpenChange}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Brush Color</label>
        <ColorChip
          value={textureSettings.brushColor}
          onChange={(color) => updateTextureSetting("brushColor", color)}
          onOpenChange={onPickerOpenChange}
        />
      </div>

      {/* Brush Size */}
      <div>
        <div style={sliderHeaderStyle}>
          <label style={sliderLabelStyle}>Brush Size</label>
          <span style={{...labelStyle, fontVariantNumeric: "tabular-nums"}}>
            {textureSettings.brushRadius}
          </span>
        </div>
        <input
          type="range"
          min="2"
          max="200"
          value={textureSettings.brushRadius}
          onChange={(e) => updateTextureSetting("brushRadius", Number(e.target.value))}
          style={{width: "100%", cursor: "pointer"}}
        />
      </div>

      {/* Change Color (palette) */}
      <div>
        <label style={{...labelStyle, display: "block", marginBottom: "8px"}}>
          Change Color
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {paletteColors.map((color, index) => {
            const isActive = textureSettings.brushColor === color;
            return (
              <ColorChip
                key={index}
                value={color}
                active={isActive}
                onSelect={() => updateTextureSetting("brushColor", color)}
                onChange={(newColor) => handlePaletteColorChange(color, newColor)}
                onOpenChange={onPickerOpenChange}
              />
            );
          })}
        </div>
      </div>

      {/* Sliders with value + indicator placeholder */}
      <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
        {[
          {key: "lineLength" as const, label: "Length", min: 0, max: 100},
          {key: "weight" as const, label: "Width", min: 1, max: 20},
          {key: "angleScale" as const, label: "Smooth", min: 1, max: 255},
          {key: "density" as const, label: "Density", min: 5, max: 200},
        ].map(({key, label, min, max}) => (
          <div key={key}>
            <div style={sliderHeaderStyle}>
              <label style={sliderLabelStyle}>{label}</label>
              <span style={{...labelStyle, fontVariantNumeric: "tabular-nums"}}>
                {textureSettings[key]}
              </span>
              <div style={{flex: 1}} />
              <div style={indicatorPlaceholder} />
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={textureSettings[key]}
              onChange={(e) => updateTextureSetting(key, Number(e.target.value))}
              style={{width: "100%", cursor: "pointer"}}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
