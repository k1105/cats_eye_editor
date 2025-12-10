"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { P5Wrapper } from "./P5Wrapper";
import { createEyeEditorSketch } from "./EyeEditorSketch";
import type { EyeState, HandleModes } from "../types";

interface CatEyeEditorProps {
  onExport?: (svg: string) => void;
  isActive?: boolean;
}

export const CatEyeEditor: React.FC<CatEyeEditorProps> = ({ onExport, isActive = true }) => {
  const [eyeballRadius, setEyeballRadius] = useState(130);
  const [k_anchorConstraint, setK_anchorConstraint] = useState(0.9);
  const [l_irisConstraint, setL_irisConstraint] = useState(0.95);
  const [m_irisScale, setM_irisScale] = useState(0.7);
  const [n_pupilScale, setN_pupilScale] = useState(0.5);
  const [blinkRatio, setBlinkRatio] = useState(0.0);

  const [eyeState, setEyeState] = useState<EyeState>({
    innerCorner: { x: -117, y: 250 },
    outerCorner: { x: 117, y: 250 },
    upperEyelid: { cp1: { x: -65, y: 150 }, cp2: { x: 65, y: 150 } },
    lowerEyelid: { cp1: { x: -65, y: 350 }, cp2: { x: 65, y: 350 } },
    iris: { x: 0, y: 250, w: 182, h: 182, color: "#aba58e" },
    pupil: { x: 0, y: 250, w: 130, h: 130 },
  });

  const [isPreview, setIsPreview] = useState(false);
  const [handleModes, setHandleModes] = useState<HandleModes>({ inner: true, outer: true });
  const [irisColor, setIrisColor] = useState("#aba58e");
  const [eyeballColor, setEyeballColor] = useState("#787878");
  const [animationStatus, setAnimationStatus] = useState("idle");
  const [eyeSpacing, setEyeSpacing] = useState(400);
  const [isPupilTracking, setIsPupilTracking] = useState(false);
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

  const onBlinkFinish = useCallback(() => setAnimationStatus("idle"), []);

  useEffect(() => {
    setEyeState((prev) => {
      const newState = JSON.parse(JSON.stringify(prev));
      const irisRadius = eyeballRadius * m_irisScale;
      const pupilRadius = eyeballRadius * n_pupilScale;
      const anchorRadius = eyeballRadius * k_anchorConstraint;

      newState.iris.w = irisRadius * 2;
      newState.iris.h = irisRadius * 2;
      newState.pupil.w = pupilRadius * 2;
      newState.pupil.h = pupilRadius * 2;

      const projectOnCircle = (point: { x: number; y: number }) => {
        const vec = {
          x: point.x - newState.iris.x,
          y: point.y - newState.iris.y,
        };
        const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        if (mag === 0) return { x: newState.iris.x + anchorRadius, y: newState.iris.y };
        return {
          x: newState.iris.x + (vec.x / mag) * anchorRadius,
          y: newState.iris.y + (vec.y / mag) * anchorRadius,
        };
      };

      newState.innerCorner = projectOnCircle(newState.innerCorner);
      newState.outerCorner = projectOnCircle(newState.outerCorner);

      return newState;
    });
  }, [eyeballRadius, k_anchorConstraint, m_irisScale, n_pupilScale]);

  useEffect(() => {
    setEyeState((prev) => ({
      ...prev,
      iris: { ...prev.iris, color: irisColor },
    }));
  }, [irisColor]);

  const sketch = useMemo(() => createEyeEditorSketch(), []);

  const handleExportSVG = () => {
    const { innerCorner, outerCorner, upperEyelid, lowerEyelid, iris, pupil } = eyeState;
    const canvasWidth = canvasSize.width;
    const centerX = canvasWidth / 2;
    const eyeballRadiusValue = eyeballRadius;

    const leftEyeCenterX = centerX - eyeSpacing / 2;
    const rightEyeCenterX = centerX + eyeSpacing / 2;

    const pathData = `M ${innerCorner.x},${innerCorner.y} C ${upperEyelid.cp1.x},${upperEyelid.cp1.y} ${upperEyelid.cp2.x},${upperEyelid.cp2.y} ${outerCorner.x},${outerCorner.y} C ${lowerEyelid.cp2.x},${lowerEyelid.cp2.y} ${lowerEyelid.cp1.x},${lowerEyelid.cp1.y} ${innerCorner.x},${innerCorner.y} Z`;
    const singleEyeGroup = `<g><defs><clipPath id="eye-clip"><path d="${pathData}" /></clipPath></defs><g clip-path="url(#eye-clip)"><circle cx="${iris.x}" cy="${iris.y}" r="${eyeballRadiusValue}" fill="${eyeballColor}" /><ellipse cx="${iris.x}" cy="${iris.y}" rx="${iris.w / 2}" ry="${iris.h / 2}" fill="${iris.color}" stroke="black" stroke-width="4" /><ellipse cx="${pupil.x}" cy="${pupil.y}" rx="${pupil.w / 2}" ry="${pupil.h / 2}" fill="#000000" /></g></g>`;

    const svgContent = `<svg width="${canvasWidth}" height="600" viewBox="0 0 ${canvasWidth} 600" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${leftEyeCenterX}, 0)">${singleEyeGroup}</g>
      <g transform="translate(${rightEyeCenterX}, 0) scale(-1, 1)">${singleEyeGroup}</g>
    </svg>`;

    if (onExport) {
      onExport(svgContent);
    }

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cat-eyes.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetToDefault = () => {
    setEyeballRadius(130);
    setK_anchorConstraint(0.9);
    setL_irisConstraint(0.95);
    setM_irisScale(0.7);
    setN_pupilScale(0.5);

    const defaultState: EyeState = {
      innerCorner: { x: -117, y: 250 },
      outerCorner: { x: 117, y: 250 },
      upperEyelid: { cp1: { x: -65, y: 150 }, cp2: { x: 65, y: 150 } },
      lowerEyelid: { cp1: { x: -65, y: 350 }, cp2: { x: 65, y: 350 } },
      iris: { x: 0, y: 250, w: 182, h: 182, color: "#aba58e" },
      pupil: { x: 0, y: 250, w: 130, h: 130 },
    };
    setEyeState(defaultState);
    setHandleModes({ inner: true, outer: true });
    setIrisColor("#aba58e");
    setEyeballColor("#787878");
    setEyeSpacing(400);
    setIsPupilTracking(false);
    setBlinkRatio(0.0);
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
            eyeState={eyeState}
            setEyeState={setEyeState}
            isPreview={isPreview}
            handleModes={handleModes}
            setHandleModes={setHandleModes}
            animationStatus={animationStatus}
            onBlinkFinish={onBlinkFinish}
            eyeSpacing={eyeSpacing}
            isPupilTracking={isPupilTracking}
            canvasSize={canvasSize}
            eyeballColor={eyeballColor}
            eyeballRadius={eyeballRadius}
            k_anchorConstraint={k_anchorConstraint}
            setK_anchorConstraint={setK_anchorConstraint}
            l_irisConstraint={l_irisConstraint}
            setL_irisConstraint={setL_irisConstraint}
            m_irisScale={m_irisScale}
            blinkRatio={blinkRatio}
            isActive={isActive}
          />
          <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
            <button
              onClick={() => setAnimationStatus("blinking")}
              disabled={animationStatus === "blinking"}
              className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              瞬き
            </button>
            <button
              onClick={() => setIsPupilTracking((prev) => !prev)}
              className={`font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ${
                isPupilTracking
                  ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                  : "bg-white hover:bg-gray-100 border border-gray-300 text-gray-800"
              }`}
            >
              目線追従 {isPupilTracking ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white p-6 rounded-xl border border-gray-200 h-full flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">プレビュー</label>
            <button
              onClick={() => setIsPreview((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
                isPreview ? "bg-yellow-400" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={isPreview}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isPreview ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                瞬き比率(t): {blinkRatio.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={blinkRatio}
                onChange={(e) => setBlinkRatio(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="border-t border-gray-200" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                眼球の半径: {eyeballRadius}
              </label>
              <input
                type="range"
                min="50"
                max="250"
                value={eyeballRadius}
                onChange={(e) => setEyeballRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                眉間の間隔: {eyeSpacing}
              </label>
              <input
                type="range"
                min="350"
                max="600"
                value={eyeSpacing}
                onChange={(e) => setEyeSpacing(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="border-t border-gray-200" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                眼球の色
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={eyeballColor}
                  onChange={(e) => setEyeballColor(e.target.value)}
                  className="w-10 h-10 border-none rounded-md cursor-pointer"
                />
                <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                  {eyeballColor}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                虹彩の色
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={irisColor}
                  onChange={(e) => setIrisColor(e.target.value)}
                  className="w-10 h-10 border-none rounded-md cursor-pointer"
                />
                <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                  {irisColor}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
            <button
              onClick={handleExportSVG}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              SVGとして書き出し
            </button>
            <button
              onClick={resetToDefault}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
