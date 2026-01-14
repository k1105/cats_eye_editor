import React, {useState} from "react";
import type {TextureSettings, EditorMode} from "../types";
import {ColorChip} from "./ColorChip";
import {TabButtons} from "./TabButtons";
import {ColorChangeDialog} from "./ColorChangeDialog";

interface TextureControlsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  textureSettings: TextureSettings;
  updateTextureSetting: <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => void;
  onReset: () => void;
  usedBrushColors: string[];
  onReplaceBrushColor: (oldColor: string, newColor: string) => void;
}

export const TextureControls: React.FC<TextureControlsProps> = ({
  activeMode,
  onModeChange,
  textureSettings,
  updateTextureSetting,
  onReset,
  usedBrushColors,
  onReplaceBrushColor,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");

  const handleOpenDialog = (color: string) => {
    setSelectedColor(color);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedColor("");
  };

  const handleConfirmColorChange = (newColor: string) => {
    if (selectedColor) {
      onReplaceBrushColor(selectedColor, newColor);
    }
    handleCloseDialog();
  };

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

          {/* 使用されているブラシ色のパレット */}
          {usedBrushColors.length > 0 && (
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{color: "var(--text-color)"}}
              >
                使用中のブラシ色 ({usedBrushColors.length})
              </label>
              <div
                className="space-y-2 max-h-64 overflow-y-auto p-2"
                style={{
                  border: "0.75px solid var(--border-color)",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                {usedBrushColors.map((color, index) => (
                  <div
                    key={`${color}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-8 h-8 rounded border"
                      style={{
                        backgroundColor: color,
                        border: "0.75px solid var(--border-color)",
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-mono truncate"
                        style={{color: "var(--text-color)"}}
                      >
                        {color}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenDialog(color)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#4CAF50",
                        border: "0.75px solid var(--border-color)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "white",
                        whiteSpace: "nowrap",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#45a049";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#4CAF50";
                      }}
                    >
                      変更
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

      {/* 色変更ダイアログ */}
      <ColorChangeDialog
        isOpen={dialogOpen}
        currentColor={selectedColor}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmColorChange}
      />
    </div>
  );
};
