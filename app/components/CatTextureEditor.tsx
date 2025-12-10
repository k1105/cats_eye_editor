"use client";

import React, {useState, useEffect, useRef, useMemo} from "react";
import {P5Wrapper} from "./P5Wrapper";
import {createTextureEditorSketch} from "./TextureEditorSketch";
import type {TextureSettings} from "../types";

interface ColorChipProps {
  value: string;
  onChange: (value: string) => void;
}

const ColorChip: React.FC<ColorChipProps> = ({value, onChange}) => {
  return (
    <div
      style={{
        width: "30%",
        aspectRatio: "2 / 1",
        border: "0.75px solid var(--border-color)",
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
};

const INIT_SETTINGS: TextureSettings = {
  density: 32,
  lineLength: 105,
  angleScale: 80,
  weight: 9,
  brushRadius: 40,
  brushColor: "#E91E63",
  baseColor: "#E6A9D4",
  backgroundColor: "#F2C2B7",
};

interface CatTextureEditorProps {
  isActive?: boolean;
}

export const CatTextureEditor: React.FC<CatTextureEditorProps> = ({
  isActive = true,
}) => {
  const [settings, setSettings] = useState<TextureSettings>(INIT_SETTINGS);
  const [canvasSize, setCanvasSize] = useState({width: 800, height: 600});
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.offsetWidth;
        const newWidth = Math.min(containerWidth, 800);
        setCanvasSize({width: newWidth, height: 600});
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sketch = useMemo(() => createTextureEditorSketch(), []);

  const resetAll = () => {
    setSettings(INIT_SETTINGS);
  };

  const updateSetting = <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => {
    setSettings((prev) => ({...prev, [key]: value}));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div ref={canvasContainerRef} className="flex-1 min-w-0">
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: canvasSize.height,
            backgroundColor: "#eeeef0",
            border: "0.75px solid var(--border-color)",
          }}
        >
          <P5Wrapper
            sketch={sketch}
            settings={settings}
            canvasSize={canvasSize}
            onResetBrush={resetAll}
            isActive={isActive}
          />
        </div>
      </div>

      <div className="w-full lg:w-80 flex-shrink-0">
        <div
          className="p-6 h-full flex flex-col gap-4"
          style={{
            backgroundColor: "#f9cb9b",
            border: "0.75px solid var(--border-color)",
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{color: "var(--text-color)"}}
              >
                毛の密度: {settings.density}
              </label>
              <input
                type="range"
                min="2"
                max="255"
                value={settings.density}
                onChange={(e) =>
                  updateSetting("density", Number(e.target.value))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{color: "var(--text-color)"}}
              >
                毛の長さ: {settings.lineLength}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={settings.lineLength}
                onChange={(e) =>
                  updateSetting("lineLength", Number(e.target.value))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{color: "var(--text-color)"}}
              >
                毛の角度: {settings.angleScale}
              </label>
              <input
                type="range"
                min="1"
                max="255"
                value={settings.angleScale}
                onChange={(e) =>
                  updateSetting("angleScale", Number(e.target.value))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{color: "var(--text-color)"}}
              >
                毛の太さ: {settings.weight}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.weight}
                onChange={(e) =>
                  updateSetting("weight", Number(e.target.value))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{color: "var(--text-color)"}}
              >
                ブラシ半径: {settings.brushRadius}
              </label>
              <input
                type="range"
                min="2"
                max="200"
                value={settings.brushRadius}
                onChange={(e) =>
                  updateSetting("brushRadius", Number(e.target.value))
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
                    value={settings.brushColor}
                    onChange={(color) => updateSetting("brushColor", color)}
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
                    value={settings.baseColor}
                    onChange={(color) => updateSetting("baseColor", color)}
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
                    value={settings.backgroundColor}
                    onChange={(color) =>
                      updateSetting("backgroundColor", color)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={resetAll}
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
    </div>
  );
};
