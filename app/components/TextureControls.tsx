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
  color: "white",
  mixBlendMode: "difference",
  whiteSpace: "nowrap",
  fontSize: "11px",
  fontWeight: 500,
  display: "block",
};

const sliderInputStyle: React.CSSProperties = {
  width: "80px",
  cursor: "pointer",
};

export const TextureControls: React.FC<TextureControlsProps> = ({
  textureSettings,
  updateTextureSetting,
  paletteColors,
  onReplacePaletteColor,
  onPickerOpenChange,
  vertical = false,
}) => {
  const handlePaletteColorChange = (oldColor: string, newColor: string) => {
    if (oldColor !== newColor) {
      onReplacePaletteColor(oldColor, newColor);
      updateTextureSetting("brushColor", newColor);
    }
  };

  const dividerStyle: React.CSSProperties = vertical
    ? {height: "1px", width: "100%", backgroundColor: "white", mixBlendMode: "difference", flexShrink: 0}
    : {width: "1px", alignSelf: "stretch", backgroundColor: "white", mixBlendMode: "difference", flexShrink: 0};

  const chipItemStyle: React.CSSProperties = vertical
    ? {display: "flex", alignItems: "center", gap: "8px"}
    : {textAlign: "center"};

  const sliderStyle: React.CSSProperties = vertical
    ? {...sliderInputStyle, width: "100%"}
    : sliderInputStyle;

  return (
    <div style={{
      display: "flex",
      flexDirection: vertical ? "column" : "row",
      alignItems: vertical ? "stretch" : "flex-end",
      gap: "12px",
      flexWrap: vertical ? "nowrap" : "wrap",
    }}>
      {/* ブラシ & 背景 */}
      <div style={{display: "flex", alignItems: vertical ? "flex-start" : "flex-end", gap: "12px"}}>
        <div style={chipItemStyle}>
          <ColorChip
            value={textureSettings.backgroundColor}
            onChange={(color) => updateTextureSetting("backgroundColor", color)}
            onOpenChange={onPickerOpenChange}
          />
          <label style={labelStyle}>背景</label>
        </div>
        <div style={chipItemStyle}>
          <ColorChip
            value={textureSettings.brushColor}
            onChange={(color) => updateTextureSetting("brushColor", color)}
            onOpenChange={onPickerOpenChange}
          />
          <label style={labelStyle}>ブラシ</label>
        </div>
      </div>
      <div>
        <input
          type="range"
          min="2"
          max="200"
          value={textureSettings.brushRadius}
          onChange={(e) => updateTextureSetting("brushRadius", Number(e.target.value))}
          style={sliderStyle}
        />
        <label style={labelStyle}>ブラシ半径</label>
      </div>

      <div style={dividerStyle} />

      {/* カラーパレット */}
      <div>
        <div style={{display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap"}}>
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
        <label style={labelStyle}>毛の色をかえる</label>
      </div>

      <div style={dividerStyle} />

      {/* スライダー */}
      <div style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: vertical ? "stretch" : "flex-end",
        gap: "12px",
        flexWrap: vertical ? "nowrap" : "wrap",
      }}>
        <div>
          <input
            type="range"
            min="5"
            max="200"
            value={textureSettings.density}
            onChange={(e) => updateTextureSetting("density", Number(e.target.value))}
            style={sliderStyle}
          />
          <label style={labelStyle}>密度</label>
        </div>
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={textureSettings.lineLength}
            onChange={(e) => updateTextureSetting("lineLength", Number(e.target.value))}
            style={sliderStyle}
          />
          <label style={labelStyle}>長さ</label>
        </div>
        <div>
          <input
            type="range"
            min="1"
            max="255"
            value={textureSettings.angleScale}
            onChange={(e) => updateTextureSetting("angleScale", Number(e.target.value))}
            style={sliderStyle}
          />
          <label style={labelStyle}>なめらかさ</label>
        </div>
        <div>
          <input
            type="range"
            min="1"
            max="20"
            value={textureSettings.weight}
            onChange={(e) => updateTextureSetting("weight", Number(e.target.value))}
            style={sliderStyle}
          />
          <label style={labelStyle}>太さ</label>
        </div>
      </div>
    </div>
  );
};
