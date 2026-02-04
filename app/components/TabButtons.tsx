import React from "react";
import type {EditorMode} from "../types";

interface TabButtonsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export const TabButtons: React.FC<TabButtonsProps> = ({
  activeMode,
  onModeChange,
}) => {
  return (
    <div className="flex">
      <button
        onClick={() => onModeChange("eye")}
        className="py-2.5 text-sm font-semibold transition-all duration-200 flex-1"
        style={{
          border: activeMode === "eye" ? "0.75px solid white" : "none",
          borderBottom: activeMode === "eye" ? "none" : "0.75px solid white",
          color: "white",
          mixBlendMode: "difference",
        }}
      >
        Eye
      </button>
      <button
        onClick={() => onModeChange("texture")}
        className="py-2.5 text-sm font-semibold transition-all duration-200 flex-1"
        style={{
          color: "white",
          border: activeMode === "texture" ? "0.75px solid white" : "none",
          borderBottom: activeMode === "texture" ? "none" : "0.75px solid white",
          mixBlendMode: "difference",
        }}
      >
        Other
      </button>
    </div>
  );
};
