"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { P5Wrapper } from "./P5Wrapper";
import { createTextureEditorSketch } from "./TextureEditorSketch";
import type { TextureSettings } from "../types";

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

export const CatTextureEditor: React.FC<CatTextureEditorProps> = ({ isActive = true }) => {
  const [settings, setSettings] = useState<TextureSettings>(INIT_SETTINGS);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.offsetWidth;
        const newWidth = Math.min(containerWidth, 800);
        setCanvasSize({ width: newWidth, height: 600 });
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

  const updateSetting = <K extends keyof TextureSettings>(key: K, value: TextureSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div ref={canvasContainerRef} className="flex-1 min-w-0">
        <div
          className="relative w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
          style={{ height: canvasSize.height }}
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 h-full flex flex-col gap-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">テクスチャ設定</h3>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                毛の密度: {settings.density}
              </label>
              <input
                type="range"
                min="2"
                max="255"
                value={settings.density}
                onChange={(e) => updateSetting("density", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                毛の長さ: {settings.lineLength}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={settings.lineLength}
                onChange={(e) => updateSetting("lineLength", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                毛の角度: {settings.angleScale}
              </label>
              <input
                type="range"
                min="1"
                max="255"
                value={settings.angleScale}
                onChange={(e) => updateSetting("angleScale", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                毛の太さ: {settings.weight}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.weight}
                onChange={(e) => updateSetting("weight", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ブラシ半径: {settings.brushRadius}
              </label>
              <input
                type="range"
                min="2"
                max="200"
                value={settings.brushRadius}
                onChange={(e) => updateSetting("brushRadius", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="border-t border-gray-200" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ブラシ色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.brushColor}
                  onChange={(e) => updateSetting("brushColor", e.target.value)}
                  className="w-10 h-10 border-none rounded-md cursor-pointer"
                />
                <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                  {settings.brushColor.toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">毛色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.baseColor}
                  onChange={(e) => updateSetting("baseColor", e.target.value)}
                  className="w-10 h-10 border-none rounded-md cursor-pointer"
                />
                <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                  {settings.baseColor.toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">背景色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                  className="w-10 h-10 border-none rounded-md cursor-pointer"
                />
                <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                  {settings.backgroundColor.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
            <button
              onClick={resetAll}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              ブラシリセット (R)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
