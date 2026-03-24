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
}) => {
  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: "12px"}}>
      <div style={{textAlign: "center"}}>
        <GrayscaleChip value={eyeballColor} onChange={setEyeballColor} />
        <label style={labelStyle}>眼球</label>
      </div>
      <div style={{textAlign: "center"}}>
        <ColorChip value={irisColor} onChange={setIrisColor} />
        <label style={labelStyle}>虹彩</label>
      </div>
      <div style={{textAlign: "center"}}>
        <ColorChip value={noseColor} onChange={setNoseColor} />
        <label style={labelStyle}>鼻</label>
      </div>
    </div>
  );
};
