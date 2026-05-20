import React from "react";
import type {TextureSettings} from "../types";
import {ColorChip} from "./ColorChip";

interface PaintControlsProps {
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
};

export const PaintControls: React.FC<PaintControlsProps> = ({
  textureSettings,
  updateTextureSetting,
  paletteColors,
  onReplacePaletteColor,
  onPickerOpenChange,
  vertical: _vertical = false,
}) => {
  const handlePaletteColorChange = (oldColor: string, newColor: string) => {
    if (oldColor === newColor) return;
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
    gap: "6px",
    marginBottom: "6px",
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
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

      <div>
        <div style={sliderHeaderStyle}>
          <label style={sliderLabelStyle}>Brush Size</label>
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
    </div>
  );
};
