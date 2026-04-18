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
  color: "#231616",
  whiteSpace: "nowrap",
  fontSize: "13px",
  fontWeight: 400,
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
  const rowStyle: React.CSSProperties = vertical
    ? {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }
    : {textAlign: "center"};

  return (
    <div style={{
      display: "flex",
      flexDirection: vertical ? "column" : "row",
      alignItems: vertical ? "stretch" : "flex-end",
      gap: "16px",
    }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Eyeball</label>
        <GrayscaleChip value={eyeballColor} onChange={setEyeballColor} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Iris</label>
        <ColorChip value={irisColor} onChange={setIrisColor} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Nose</label>
        <ColorChip value={noseColor} onChange={setNoseColor} />
      </div>
    </div>
  );
};
