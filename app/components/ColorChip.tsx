import React from "react";

interface ColorChipProps {
  value: string;
  onChange: (value: string) => void;
}

export const ColorChip: React.FC<ColorChipProps> = ({value, onChange}) => {
  return (
    <div
      style={{
        maxWidth: "40px",
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        overflow: "visible",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      {/* ボーダーのみにmixBlendModeを適用 */}
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
    </div>
  );
};
