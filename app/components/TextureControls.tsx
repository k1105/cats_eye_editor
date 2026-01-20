import React, {useState, useEffect, useMemo} from "react";
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
  // 各色に一意のIDを割り当てる（インデックスベース、安定したID管理）
  // 色の値が変わっても、同じ位置の色は同じIDを持つ
  const colorIds = useMemo(() => {
    return usedBrushColors.map((_, index) => index);
  }, [usedBrushColors.length]); // 色の数が変わった時のみ再計算

  // プレビュー用のローカルstate（色を変更している最中の一時的な値）
  const [previewColors, setPreviewColors] = useState<Map<number, string>>(
    new Map()
  );

  // usedBrushColorsが更新されたら、プレビューをリセット
  useEffect(() => {
    setPreviewColors(new Map());
  }, [usedBrushColors.length]); // 色の数が変わった時のみリセット

  // プレビュー用の色を取得
  const getDisplayColor = (color: string, index: number): string => {
    const id = colorIds[index] ?? index;
    return previewColors.get(id) ?? color;
  };

  // 色の変更をプレビュー（onInput）
  const handleColorInput = (id: number, newColor: string) => {
    setPreviewColors((prev) => {
      const next = new Map(prev);
      next.set(id, newColor);
      return next;
    });
  };

  // 色の変更を確定（onBlur）
  const handleColorBlur = (oldColor: string, newColor: string, id: number) => {
    // プレビューをクリア
    setPreviewColors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    // 色が実際に変更された場合のみ更新
    if (oldColor !== newColor) {
      onReplaceBrushColor(oldColor, newColor);
    }
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
        style={{overflowY: "scroll", overflowX: "visible"}}
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
                className="flex flex-wrap gap-2 p-2"
                style={{
                  border: "0.75px solid var(--border-color)",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  maxHeight: "200px",
                  overflowY: "auto",
                  overflowX: "visible",
                  position: "relative",
                }}
              >
                {usedBrushColors.map((color, index) => {
                  const id = colorIds[index] ?? index;
                  const displayColor = getDisplayColor(color, index);
                  return (
                    <div
                      key={id}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        border: "0.75px solid var(--border-color)",
                        overflow: "hidden",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="color"
                        value={displayColor}
                        onInput={(e) =>
                          handleColorInput(id, e.currentTarget.value)
                        }
                        onBlur={(e) =>
                          handleColorBlur(color, e.currentTarget.value, id)
                        }
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
                })}
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
    </div>
  );
};
