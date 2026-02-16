import React, {useState, useEffect, useMemo} from "react";
import type {TextureSettings, EditorMode} from "../types";
import {ColorChip} from "./ColorChip";
import {TabButtons} from "./TabButtons";
import {Icon} from "@iconify/react";

interface TextureControlsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  textureSettings: TextureSettings;
  updateTextureSetting: <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => void;
  paletteColors: string[];
  onReplacePaletteColor: (oldColor: string, newColor: string) => void;
}

export const TextureControls: React.FC<TextureControlsProps> = ({
  activeMode,
  onModeChange,
  textureSettings,
  updateTextureSetting,
  paletteColors,
  onReplacePaletteColor,
}) => {
  // 各色に一意のIDを割り当てる（インデックスベース、安定したID管理）
  // 色の値が変わっても、同じ位置の色は同じIDを持つ
  const colorIds = useMemo(() => {
    return paletteColors.map((_, index) => index);
  }, [paletteColors.length]); // 色の数が変わった時のみ再計算

  // プレビュー用のローカルstate（色を変更している最中の一時的な値）
  const [previewColors, setPreviewColors] = useState<Map<number, string>>(
    new Map()
  );

  // paletteColorsが更新されたら、プレビューをリセット
  useEffect(() => {
    setPreviewColors(new Map());
  }, [paletteColors.length]); // 色の数が変わった時のみリセット

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
      onReplacePaletteColor(oldColor, newColor);
      // ブラシ色も新しい色に追従
      updateTextureSetting("brushColor", newColor);
    }
  };

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
        style={{overflowY: "scroll", overflowX: "visible"}}
      >
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{color: "white", mixBlendMode: "difference"}}
            >
              毛の密度: {textureSettings.density}
            </label>
            <input
              type="range"
              min="5"
              max="200"
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
              style={{color: "white", mixBlendMode: "difference"}}
            >
              毛の長さ: {textureSettings.lineLength}
            </label>
            <input
              type="range"
              min="0"
              max="100"
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
              style={{color: "white", mixBlendMode: "difference"}}
            >
              毛並みのなめらかさ: {textureSettings.angleScale}
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
              style={{color: "white", mixBlendMode: "difference"}}
            >
              毛の太さ: {textureSettings.weight}
            </label>
            <input
              type="range"
              min="1"
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
              style={{color: "white", mixBlendMode: "difference"}}
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
            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{color: "white", mixBlendMode: "difference"}}
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
                  style={{color: "white", mixBlendMode: "difference"}}
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

          {/* カラーパレット */}
          {paletteColors.length > 0 && (
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{color: "white", mixBlendMode: "difference"}}
              >
                カラーパレット ({paletteColors.length})
              </label>
              <div
                className="flex flex-wrap gap-2"
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  padding: "5px",
                }}
              >
                {paletteColors.map((color, index) => {
                  const id = colorIds[index] ?? index;
                  const displayColor = getDisplayColor(color, index);
                  const isActive = textureSettings.brushColor === color;
                  return (
                    <div
                      key={id}
                      style={{
                        width: "40px",
                        aspectRatio: "1 / 1",
                        borderRadius: "50%",
                        overflow: "visible",
                        flexShrink: 0,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: isActive
                          ? "2.5px solid white"
                          : "none",
                        outlineOffset: "2px",
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
                          width: "calc(100% - 2px)",
                          height: "calc(100% - 2px)",
                          border: "none",
                          margin: 0,
                          borderRadius: "50%",
                          overflow: "hidden",
                        }}
                      />
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
                      {/* 非アクティブ時はクリックを遮断し、ブラシ色の切替のみ行う */}
                      {!isActive && (
                        <div
                          onClick={() =>
                            updateTextureSetting("brushColor", color)
                          }
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: "50%",
                            cursor: "pointer",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
