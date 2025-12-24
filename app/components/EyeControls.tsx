import React from "react";
import type {EyeState, NoseSettings} from "../types";
import {ColorChip} from "./ColorChip";
import {TabButtons} from "./TabButtons";
import type {EditorMode} from "../types";

interface EyeControlsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  // Eye state
  eyeState: EyeState;
  eyeballRadius: number;
  setEyeballRadius: (value: number) => void;
  eyeSpacing: number;
  setEyeSpacing: (value: number) => void;
  eyeballColor: string;
  setEyeballColor: (value: string) => void;
  irisColor: string;
  setIrisColor: (value: string) => void;
  pupilWidthRatio: number;
  setPupilWidthRatio: (value: number) => void;
  // Nose settings
  noseSettings: NoseSettings;
  setNoseSettings: React.Dispatch<React.SetStateAction<NoseSettings>>;
  // Preview and animation
  isPreview: boolean;
  setIsPreview: (value: boolean | ((prev: boolean) => boolean)) => void;
  animationStatus: string;
  setAnimationStatus: (value: string) => void;
  // Reset function
  onReset: () => void;
}

export const EyeControls: React.FC<EyeControlsProps> = ({
  activeMode,
  onModeChange,
  eyeState,
  eyeballRadius,
  setEyeballRadius,
  eyeSpacing,
  setEyeSpacing,
  eyeballColor,
  setEyeballColor,
  irisColor,
  setIrisColor,
  pupilWidthRatio,
  setPupilWidthRatio,
  noseSettings,
  setNoseSettings,
  isPreview,
  setIsPreview,
  animationStatus,
  setAnimationStatus,
  onReset,
}) => {
  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: "#f9cb9b",
        border: "0.75px solid var(--border-color)",
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
        <div className="flex items-center justify-between">
          <label
            className="text-sm font-medium"
            style={{color: "var(--text-color)"}}
          >
            瞬き
          </label>
          <button
            onClick={() => {
              if (animationStatus !== "blinking") {
                setAnimationStatus("blinking");
              }
            }}
            disabled={animationStatus === "blinking"}
            className={`relative inline-flex h-6 w-11 items-center transition-colors duration-200 focus:outline-none ${
              animationStatus === "blinking" ? "bg-yellow-400" : "bg-gray-300"
            }`}
            style={{border: "0.75px solid var(--border-color)"}}
            role="switch"
            aria-checked={animationStatus === "blinking"}
          >
            <span
              className={`inline-block h-4 w-4 transform bg-white transition-transform duration-200 ${
                animationStatus === "blinking"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
              style={{border: "0.75px solid var(--border-color)"}}
            />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              眼球の半径: {eyeballRadius}
            </label>
            <input
              type="range"
              min="50"
              max="250"
              value={eyeballRadius}
              onChange={(e) => setEyeballRadius(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              眼球の色
            </label>
            <ColorChip value={eyeballColor} onChange={setEyeballColor} />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              虹彩の色
            </label>
            <ColorChip value={irisColor} onChange={setIrisColor} />
          </div>

          {/* Pupil Controls */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              瞳孔の幅: {pupilWidthRatio.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={pupilWidthRatio}
              onChange={(e) => setPupilWidthRatio(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Nose Controls */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              鼻の高さ: {noseSettings.y}
            </label>
            <input
              type="range"
              min="300"
              max="550"
              value={noseSettings.y}
              onChange={(e) =>
                setNoseSettings((prev) => ({
                  ...prev,
                  y: Number(e.target.value),
                }))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              鼻の大きさ: {noseSettings.scale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.3"
              max="2.0"
              step="0.1"
              value={noseSettings.scale}
              onChange={(e) =>
                setNoseSettings((prev) => ({
                  ...prev,
                  scale: Number(e.target.value),
                }))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              鼻の色
            </label>
            <ColorChip
              value={noseSettings.color}
              onChange={(color) =>
                setNoseSettings((prev) => ({
                  ...prev,
                  color,
                }))
              }
            />
          </div>

          {/* Coordinate Display */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              現在の座標
            </label>
            <div
              className="bg-gray-50 p-3 text-xs font-mono space-y-1"
              style={{border: "0.75px solid var(--border-color)"}}
            >
              <div style={{color: "var(--text-color)"}}>
                目頭: x={eyeState.innerCorner.x}, y={eyeState.innerCorner.y}
              </div>
              <div style={{color: "var(--text-color)"}}>
                目尻: x={eyeState.outerCorner.x}, y={eyeState.outerCorner.y}
              </div>
              <div style={{color: "var(--text-color)"}}>
                上まぶたCP1: x={eyeState.upperEyelid.cp1.x.toFixed(1)}, y=
                {eyeState.upperEyelid.cp1.y.toFixed(1)}
              </div>
              <div style={{color: "var(--text-color)"}}>
                上まぶたCP2: x={eyeState.upperEyelid.cp2.x.toFixed(1)}, y=
                {eyeState.upperEyelid.cp2.y.toFixed(1)}
              </div>
              <div style={{color: "var(--text-color)"}}>
                下まぶたCP1: x={eyeState.lowerEyelid.cp1.x.toFixed(1)}, y=
                {eyeState.lowerEyelid.cp1.y.toFixed(1)}
              </div>
              <div style={{color: "var(--text-color)"}}>
                下まぶたCP2: x={eyeState.lowerEyelid.cp2.x.toFixed(1)}, y=
                {eyeState.lowerEyelid.cp2.y.toFixed(1)}
              </div>
              <div style={{color: "var(--text-color)"}}>
                虹彩中心: x={eyeState.iris.x}, y={eyeState.iris.y}
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <button
            onClick={onReset}
            className="w-full bg-gray-200 hover:bg-gray-300 font-semibold py-3 px-4 transition-colors duration-200"
            style={{
              border: "0.75px solid var(--border-color)",
              color: "var(--text-color)",
            }}
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
};
