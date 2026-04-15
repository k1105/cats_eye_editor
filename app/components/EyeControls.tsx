import React from "react";
import {ColorChip} from "./ColorChip";
import {GrayscaleChip} from "./GrayscaleChip";

interface EyeControlsProps {
  eyeballColor: string;
  setEyeballColor: (value: string) => void;
  irisColor: string;
  setIrisColor: (value: string) => void;
  noseColor: string;
  setNoseColor: (value: string) => void;
  vertical?: boolean;
}

const labelStyle: React.CSSProperties = {
  color: "white",
  mixBlendMode: "difference",
  whiteSpace: "nowrap",
  fontSize: "11px",
  fontWeight: 500,
};

export const EyeControls: React.FC<EyeControlsProps> = ({
  eyeballColor,
  setEyeballColor,
  irisColor,
  setIrisColor,
  noseColor,
  setNoseColor,
  vertical = false,
}) => {
  const itemStyle: React.CSSProperties = vertical
    ? {display: "flex", alignItems: "center", gap: "8px"}
    : {textAlign: "center"};

  return (
    <div style={{
      display: "flex",
      flexDirection: vertical ? "column" : "row",
      alignItems: vertical ? "flex-start" : "flex-end",
      gap: "12px",
    }}>
      <div style={itemStyle}>
        <GrayscaleChip value={eyeballColor} onChange={setEyeballColor} />
        <label style={labelStyle}>眼球</label>
      </div>
      <div style={itemStyle}>
        <ColorChip value={irisColor} onChange={setIrisColor} />
        <label style={labelStyle}>虹彩</label>
      </div>
      <div style={itemStyle}>
        <ColorChip value={noseColor} onChange={setNoseColor} />
        <label style={labelStyle}>鼻</label>
      </div>
    </div>
  );
};
