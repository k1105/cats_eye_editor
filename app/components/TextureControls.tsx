import React, {useState, useEffect, useMemo} from "react";
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
}) => {
  const colorIds = useMemo(() => {
    return paletteColors.map((_, index) => index);
  }, [paletteColors.length]);

  const [previewColors, setPreviewColors] = useState<Map<number, string>>(
    new Map()
  );

  useEffect(() => {
    setPreviewColors(new Map());
  }, [paletteColors.length]);

  const getDisplayColor = (color: string, index: number): string => {
    const id = colorIds[index] ?? index;
    return previewColors.get(id) ?? color;
  };

  const handleColorInput = (id: number, newColor: string) => {
    setPreviewColors((prev) => {
      const next = new Map(prev);
      next.set(id, newColor);
      return next;
    });
  };

  const handleColorBlur = (oldColor: string, newColor: string, id: number) => {
    setPreviewColors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    if (oldColor !== newColor) {
      onReplacePaletteColor(oldColor, newColor);
      updateTextureSetting("brushColor", newColor);
    }
  };

  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap"}}>
      <div>
        <input
          type="range"
          min="5"
          max="200"
          value={textureSettings.density}
          onChange={(e) => updateTextureSetting("density", Number(e.target.value))}
          style={sliderInputStyle}
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
          style={sliderInputStyle}
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
          style={sliderInputStyle}
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
          style={sliderInputStyle}
        />
        <label style={labelStyle}>太さ</label>
      </div>
      <div>
        <input
          type="range"
          min="2"
          max="200"
          value={textureSettings.brushRadius}
          onChange={(e) => updateTextureSetting("brushRadius", Number(e.target.value))}
          style={sliderInputStyle}
        />
        <label style={labelStyle}>ブラシ半径</label>
      </div>
      <div style={{textAlign: "center"}}>
        <ColorChip
          value={textureSettings.brushColor}
          onChange={(color) => updateTextureSetting("brushColor", color)}
        />
        <label style={labelStyle}>ブラシ</label>
      </div>
      <div style={{textAlign: "center"}}>
        <ColorChip
          value={textureSettings.backgroundColor}
          onChange={(color) => updateTextureSetting("backgroundColor", color)}
        />
        <label style={labelStyle}>背景</label>
      </div>
      {/* カラーパレット */}
      {paletteColors.map((color, index) => {
        const id = colorIds[index] ?? index;
        const displayColor = getDisplayColor(color, index);
        const isActive = textureSettings.brushColor === color;
        return (
          <div key={id} style={{textAlign: "center"}}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "visible",
                flexShrink: 0,
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: isActive ? "2.5px solid white" : "none",
                outlineOffset: "2px",
              }}
            >
              <input
                type="color"
                value={displayColor}
                onInput={(e) => handleColorInput(id, e.currentTarget.value)}
                onBlur={(e) => handleColorBlur(color, e.currentTarget.value, id)}
                className="cursor-pointer"
                style={{
                  width: "calc(100% - 2px)",
                  height: "calc(100% - 2px)",
                  border: "none",
                  margin: 0,
                  borderRadius: "50%",
                  overflow: "hidden",
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
              {!isActive && (
                <div
                  onClick={() => updateTextureSetting("brushColor", color)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                />
              )}
            </div>
            <label style={labelStyle}>&nbsp;</label>
          </div>
        );
      })}
    </div>
  );
};
