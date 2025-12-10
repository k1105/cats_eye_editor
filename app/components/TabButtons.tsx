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
          backgroundColor: activeMode === "eye" ? "#f9cb9b" : "#fbbf24",
          color: "var(--text-color)",
          borderRight:
            activeMode === "eye" ? "0.75px solid var(--border-color)" : "none",
          borderBottom: "none",
        }}
      >
        Eye
      </button>
      <button
        onClick={() => onModeChange("texture")}
        className="py-2.5 text-sm font-semibold transition-all duration-200 flex-1"
        style={{
          backgroundColor: activeMode === "texture" ? "#f9cb9b" : "#fbbf24",
          color: "var(--text-color)",
          borderBottom: "none",
          borderLeft:
            activeMode === "texture"
              ? "0.75px solid var(--border-color)"
              : "none",
        }}
      >
        Other
      </button>
    </div>
  );
};

