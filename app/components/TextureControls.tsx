import React from "react";
import type {TextureSettings, EditorMode} from "../types";
import {ColorChip} from "./ColorChip";
import {TabButtons} from "./TabButtons";

interface TextureControlsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  textureSettings: TextureSettings;
  updateTextureSetting: <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => void;
  onReset: () => void;
}

export const TextureControls: React.FC<TextureControlsProps> = ({
  activeMode,
  onModeChange,
  textureSettings,
  updateTextureSetting,
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
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              毛の密度: {textureSettings.density}
            </label>
            <input
              type="range"
              min="2"
              max="255"
              value={textureSettings.density}
              onChange={(e) =>
                updateTextureSetting("density", Number(e.target.value))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              毛の長さ: {textureSettings.lineLength}
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={textureSettings.lineLength}
              onChange={(e) =>
                updateTextureSetting("lineLength", Number(e.target.value))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              毛の角度: {textureSettings.angleScale}
            </label>
            <input
              type="range"
              min="1"
              max="255"
              value={textureSettings.angleScale}
              onChange={(e) =>
                updateTextureSetting("angleScale", Number(e.target.value))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              毛の太さ: {textureSettings.weight}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={textureSettings.weight}
              onChange={(e) =>
                updateTextureSetting("weight", Number(e.target.value))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              ブラシ半径: {textureSettings.brushRadius}
            </label>
            <input
              type="range"
              min="2"
              max="200"
              value={textureSettings.brushRadius}
              onChange={(e) =>
                updateTextureSetting("brushRadius", Number(e.target.value))
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "var(--text-color)"}}
            >
              ブラシ色・毛色・背景色
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{color: "var(--text-color)"}}
                >
                  ブラシ色
                </label>
                <ColorChip
                  value={textureSettings.brushColor}
                  onChange={(color) =>
                    updateTextureSetting("brushColor", color)
                  }
                />
              </div>
              <div className="flex-1">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{color: "var(--text-color)"}}
                >
                  毛色
                </label>
                <ColorChip
                  value={textureSettings.baseColor}
                  onChange={(color) => updateTextureSetting("baseColor", color)}
                />
              </div>
              <div className="flex-1">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{color: "var(--text-color)"}}
                >
                  背景色
                </label>
                <ColorChip
                  value={textureSettings.backgroundColor}
                  onChange={(color) =>
                    updateTextureSetting("backgroundColor", color)
                  }
                />
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
            ブラシリセット (R)
          </button>
        </div>
      </div>
    </div>
  );
};
