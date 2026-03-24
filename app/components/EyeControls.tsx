import React from "react";
import {ColorChip} from "./ColorChip";
import {GrayscaleChip} from "./GrayscaleChip";
import {TabButtons} from "./TabButtons";
import type {EditorMode} from "../types";

interface EyeControlsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  eyeballColor: string;
  setEyeballColor: (value: string) => void;
  irisColor: string;
  setIrisColor: (value: string) => void;
  noseColor: string;
  setNoseColor: (value: string) => void;
}

export const EyeControls: React.FC<EyeControlsProps> = ({
  activeMode,
  onModeChange,
  eyeballColor,
  setEyeballColor,
  irisColor,
  setIrisColor,
  noseColor,
  setNoseColor,
}) => {
  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <TabButtons activeMode={activeMode} onModeChange={onModeChange} />
      <div className="p-4">
        <div className="flex gap-3" style={{maxWidth: 540}}>
          <div className="flex-1">
            <label
              className="block text-xs font-medium mb-1"
              style={{color: "white", mixBlendMode: "difference"}}
            >
              眼球の色
            </label>
            <GrayscaleChip value={eyeballColor} onChange={setEyeballColor} />
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
          <div className="flex-1">
            <label
              className="block text-xs font-medium mb-1"
              style={{color: "white", mixBlendMode: "difference"}}
            >
              鼻の色
            </label>
            <ColorChip value={noseColor} onChange={setNoseColor} />
          </div>
        </div>
      </div>
    </div>
  );
};
