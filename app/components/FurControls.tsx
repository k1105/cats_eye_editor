import React from "react";
import type {TextureSettings} from "../types";

interface FurControlsProps {
  textureSettings: TextureSettings;
  updateTextureSetting: <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => void;
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

export const FurControls: React.FC<FurControlsProps> = ({
  textureSettings,
  updateTextureSetting,
  vertical: _vertical = false,
}) => {
  const sliderHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
  };

  const indicatorIconStyle: React.CSSProperties = {
    height: "13px",
    width: "13px",
    objectFit: "contain",
    flexShrink: 0,
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
      {[
        {key: "lineLength" as const, label: "Length", min: 0, max: 100, icon: "/length.svg"},
        {key: "weight" as const, label: "Width", min: 1, max: 20, icon: "/width.svg"},
        {key: "angleScale" as const, label: "Smooth", min: 1, max: 255, icon: "/smooth.svg"},
        {key: "density" as const, label: "Density", min: 5, max: 200, icon: "/density.svg"},
      ].map(({key, label, min, max, icon}) => (
        <div key={key}>
          <div style={sliderHeaderStyle}>
            <label style={sliderLabelStyle}>{label}</label>
            <span style={{...labelStyle, fontVariantNumeric: "tabular-nums"}}>
              {textureSettings[key]}
            </span>
            <div style={{flex: 1}} />
            <img src={icon} alt={`${label} icon`} style={indicatorIconStyle} />
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
  );
};
