import React from "react";

interface ColorChipProps {
  value: string;
  onChange: (value: string) => void;
}

export const ColorChip: React.FC<ColorChipProps> = ({value, onChange}) => {
  return (
    <div
      style={{
        maxWidth: "80px",
        aspectRatio: "2 / 1",
        border: "0.75px solid var(--border-color)",
        overflow: "hidden",
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          padding: 0,
          margin: 0,
        }}
      />
    </div>
  );
};
