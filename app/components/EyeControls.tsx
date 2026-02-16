import React from "react";
import {ColorChip} from "./ColorChip";
import {TabButtons} from "./TabButtons";
import type {EditorMode} from "../types";

interface EyeControlsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  eyeballColor: string;
  setEyeballColor: (value: string) => void;
  irisColor: string;
  setIrisColor: (value: string) => void;
}

export const EyeControls: React.FC<EyeControlsProps> = ({
  activeMode,
  onModeChange,
  eyeballColor,
  setEyeballColor,
  irisColor,
  setIrisColor,
}) => {
  return (
    <div
      className="flex flex-col"
      style={{
        overflow: "hidden",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      {/* Tabs */}
      <TabButtons activeMode={activeMode} onModeChange={onModeChange} />
      <div
        className="p-6 flex-1 flex flex-col gap-4"
        style={{overflowY: "scroll"}}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="block text-xs font-medium mb-1"
                style={{color: "white", mixBlendMode: "difference"}}
              >
                眼球の色
              </label>
              <ColorChip value={eyeballColor} onChange={setEyeballColor} />
            </div>
            <div className="flex-1">
              <label
                className="block text-xs font-medium mb-1"
                style={{color: "white", mixBlendMode: "difference"}}
              >
                虹彩の色
              </label>
              <ColorChip value={irisColor} onChange={setIrisColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
