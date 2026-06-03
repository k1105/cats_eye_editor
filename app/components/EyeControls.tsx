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
  pupilWidthRatio: number;
  setPupilWidthRatio: (value: number) => void;
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
  pupilWidthRatio,
  setPupilWidthRatio,
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

  const sliderHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
  };

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
      <div>
        <div style={sliderHeaderStyle}>
          <label style={{...labelStyle, display: "inline-block"}}>Pupil width</label>
          <span style={{...labelStyle, fontVariantNumeric: "tabular-nums"}}>
            {Math.round(pupilWidthRatio * 100)}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={1}
          value={Math.round(pupilWidthRatio * 100)}
          onChange={(e) => setPupilWidthRatio(Number(e.target.value) / 100)}
          style={{width: "100%", cursor: "pointer"}}
        />
      </div>
    </div>
  );
};
