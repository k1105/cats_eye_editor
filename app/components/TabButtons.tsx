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
        className="py-2.5 text-sm font-semibold transition-colors duration-200 flex-1"
        style={{
          backgroundColor: activeMode === "eye" ? "transparent" : "white",
          color: activeMode === "eye" ? "white" : "black",
          border: "none",
          mixBlendMode: "difference",
        }}
      >
        Eye
      </button>
      <button
        onClick={() => onModeChange("texture")}
        className="py-2.5 text-sm font-semibold transition-colors duration-200 flex-1"
        style={{
          backgroundColor: activeMode === "texture" ? "transparent" : "white",
          color: activeMode === "texture" ? "white" : "black",
          border: "none",
          mixBlendMode: "difference",
        }}
      >
        Fur
      </button>
    </div>
  );
};
