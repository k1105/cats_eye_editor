"use client";

import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {P5Wrapper} from "./P5Wrapper";
import {createUnifiedEditorSketch} from "./UnifiedEditorSketch";
import type {
  EyeState,
  HandleModes,
  TextureSettings,
  EditorMode,
  NoseSettings,
} from "../types";

const INIT_TEXTURE_SETTINGS: TextureSettings = {
  density: 32,
  lineLength: 66,
  angleScale: 60,
  weight: 1,
  brushRadius: 40,
  brushColor: "#5F5457",
  baseColor: "#787878",
  backgroundColor: "#545454",
};

const INIT_EYE_STATE: EyeState = {
  innerCorner: {x: -83.693202301636, y: 240.22228496777822},
  outerCorner: {x: 78.73281498445404, y: 280.0216533085311},
  upperEyelid: {cp1: {x: -71.7, y: 166.8}, cp2: {x: 90.5, y: 209.8}},
  lowerEyelid: {cp1: {x: -96.7, y: 319.6}, cp2: {x: 71.3, y: 324.0}},
  iris: {x: 0, y: 250, w: 161, h: 161, color: "#ffcc00"},
  pupil: {x: 0, y: 250, w: 107, h: 107},
};

const INIT_NOSE_SETTINGS: NoseSettings = {
  y: 347,
  scale: 1.3,
  color: "#171717",
};

export const UnifiedEditor: React.FC = () => {
  const [activeMode, setActiveMode] = useState<EditorMode>("eye");
  const [canvasSize, setCanvasSize] = useState({width: 800, height: 600});
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Texture settings
  const [textureSettings, setTextureSettings] = useState<TextureSettings>(
    INIT_TEXTURE_SETTINGS
  );

  // Eye settings
  const [eyeballRadius, setEyeballRadius] = useState(115);
  const [k_anchorConstraint, setK_anchorConstraint] = useState(0.733);
  const [l_irisConstraint, setL_irisConstraint] = useState(0.95);
  const [m_irisScale, setM_irisScale] = useState(0.7);
  const [n_pupilScale, setN_pupilScale] = useState(0.5);
  const [blinkRatio, setBlinkRatio] = useState(0.47);
  const [eyeState, setEyeState] = useState<EyeState>(INIT_EYE_STATE);
  const [isPreview, setIsPreview] = useState(false);
  const [handleModes, setHandleModes] = useState<HandleModes>({
    inner: true,
    outer: true,
  });
  const [irisColor, setIrisColor] = useState("#ffcc00");
  const [eyeballColor, setEyeballColor] = useState("#e6e6e6");
  const [animationStatus, setAnimationStatus] = useState("idle");
  const [eyeSpacing, setEyeSpacing] = useState(458);
  const [isPupilTracking, setIsPupilTracking] = useState(false);

  // Nose settings
  const [noseSettings, setNoseSettings] =
    useState<NoseSettings>(INIT_NOSE_SETTINGS);

  // Pupil width (1.0 = circle, 0.1 = narrow cat eye)
  const [pupilWidthRatio, setPupilWidthRatio] = useState(0.46);

  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.offsetWidth;
        const containerHeight = canvasContainerRef.current.offsetHeight;

        // Maintain 4:3 aspect ratio (800:600)
        const aspectRatio = 4 / 3;
        let newWidth = containerWidth;
        let newHeight = newWidth / aspectRatio;

        // If height exceeds container, adjust based on height
        if (newHeight > containerHeight) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        }

        setCanvasSize({
          width: Math.floor(newWidth),
          height: Math.floor(newHeight),
        });
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

      const projectOnCircle = (point: {x: number; y: number}) => {
        const vec = {
          x: point.x - newState.iris.x,
          y: point.y - newState.iris.y,
        };
        const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        if (mag === 0)
          return {x: newState.iris.x + anchorRadius, y: newState.iris.y};
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
      iris: {...prev.iris, color: irisColor},
    }));
  }, [irisColor]);

  const sketch = useMemo(() => createUnifiedEditorSketch(), []);

  const resetTextureSettings = () => {
    setTextureSettings(INIT_TEXTURE_SETTINGS);
  };

  const updateTextureSetting = <K extends keyof TextureSettings>(
    key: K,
    value: TextureSettings[K]
  ) => {
    setTextureSettings((prev) => ({...prev, [key]: value}));
  };

  // const handleExportSVG = () => {
  //   const { innerCorner, outerCorner, upperEyelid, lowerEyelid, iris, pupil } = eyeState;
  //   const canvasWidth = canvasSize.width;
  //   const centerX = canvasWidth / 2;
  //   const eyeballRadiusValue = eyeballRadius;

  //   const leftEyeCenterX = centerX - eyeSpacing / 2;
  //   const rightEyeCenterX = centerX + eyeSpacing / 2;

  //   const pathData = `M ${innerCorner.x},${innerCorner.y} C ${upperEyelid.cp1.x},${upperEyelid.cp1.y} ${upperEyelid.cp2.x},${upperEyelid.cp2.y} ${outerCorner.x},${outerCorner.y} C ${lowerEyelid.cp2.x},${lowerEyelid.cp2.y} ${lowerEyelid.cp1.x},${lowerEyelid.cp1.y} ${innerCorner.x},${innerCorner.y} Z`;
  //   const singleEyeGroup = `<g><defs><clipPath id="eye-clip"><path d="${pathData}" /></clipPath></defs><g clip-path="url(#eye-clip)"><circle cx="${iris.x}" cy="${iris.y}" r="${eyeballRadiusValue}" fill="${eyeballColor}" /><ellipse cx="${iris.x}" cy="${iris.y}" rx="${iris.w / 2}" ry="${iris.h / 2}" fill="${iris.color}" stroke="black" stroke-width="4" /><ellipse cx="${pupil.x}" cy="${pupil.y}" rx="${pupil.w / 2}" ry="${pupil.h / 2}" fill="#000000" /></g></g>`;

  //   const svgContent = `<svg width="${canvasWidth}" height="600" viewBox="0 0 ${canvasWidth} 600" xmlns="http://www.w3.org/2000/svg">
  //     <g transform="translate(${leftEyeCenterX}, 0)">${singleEyeGroup}</g>
  //     <g transform="translate(${rightEyeCenterX}, 0) scale(-1, 1)">${singleEyeGroup}</g>
  //   </svg>`;

  //   const blob = new Blob([svgContent], { type: "image/svg+xml" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "cat-eyes.svg";
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  const resetEyeToDefault = () => {
    setEyeballRadius(115);
    setK_anchorConstraint(0.733);
    setL_irisConstraint(0.95);
    setM_irisScale(0.7);
    setN_pupilScale(0.5);
    setEyeState(INIT_EYE_STATE);
    setHandleModes({inner: true, outer: true});
    setIrisColor("#ffcc00");
    setEyeballColor("#e6e6e6");
    setEyeSpacing(464);
    setIsPupilTracking(false);
    setBlinkRatio(0.47);
    setNoseSettings(INIT_NOSE_SETTINGS);
    setPupilWidthRatio(0.35);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            <button
              onClick={() => setActiveMode("eye")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeMode === "eye"
                  ? "bg-yellow-400 text-yellow-900 shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              猫の目エディタ
            </button>
            <button
              onClick={() => setActiveMode("texture")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeMode === "texture"
                  ? "bg-yellow-400 text-yellow-900 shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              毛並みエディタ
            </button>
          </div>
        </div>
      </div>

      {/* Canvas and Controls */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 h-full">
          <div className="flex flex-col lg:flex-row gap-4 w-full h-full">
            {/* Canvas */}
            <div ref={canvasContainerRef} className="flex-1 min-w-0 min-h-0">
              <div className="relative w-full h-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex items-center justify-center">
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
                  textureSettings={textureSettings}
                  onResetBrush={resetTextureSettings}
                  activeMode={activeMode}
                  noseSettings={noseSettings}
                  pupilWidthRatio={pupilWidthRatio}
                />

                {/* Eye controls overlay */}
                {activeMode === "eye" && (
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
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-80 flex-shrink-0">
              {activeMode === "eye" ? (
                /* Eye Controls */
                <div className="bg-white p-6 rounded-xl border border-gray-200 h-full flex flex-col gap-4 shadow-sm">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setIsPreview(false)}
                      className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                        !isPreview
                          ? "bg-white shadow-sm text-gray-800"
                          : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setIsPreview(true)}
                      className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                        isPreview
                          ? "bg-white shadow-sm text-gray-800"
                          : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      プレビュー
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
                        onChange={(e) =>
                          setEyeballRadius(Number(e.target.value))
                        }
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

                    <div className="border-t border-gray-200" />

                    {/* Pupil Controls */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        瞳孔の幅: {pupilWidthRatio.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.01"
                        value={pupilWidthRatio}
                        onChange={(e) =>
                          setPupilWidthRatio(Number(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        1.0 = 真円、0.1 = 細い猫の目
                      </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Nose Controls */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        鼻の色
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={noseSettings.color}
                          onChange={(e) =>
                            setNoseSettings((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="w-10 h-10 border-none rounded-md cursor-pointer"
                        />
                        <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                          {noseSettings.color.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Coordinate Display */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        現在の座標
                      </label>
                      <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1">
                        <div className="text-gray-600">
                          目頭: x={eyeState.innerCorner.x}, y=
                          {eyeState.innerCorner.y}
                        </div>
                        <div className="text-gray-600">
                          目尻: x={eyeState.outerCorner.x}, y=
                          {eyeState.outerCorner.y}
                        </div>
                        <div className="text-gray-600">
                          上まぶたCP1: x={eyeState.upperEyelid.cp1.x.toFixed(1)}
                          , y={eyeState.upperEyelid.cp1.y.toFixed(1)}
                        </div>
                        <div className="text-gray-600">
                          上まぶたCP2: x={eyeState.upperEyelid.cp2.x.toFixed(1)}
                          , y={eyeState.upperEyelid.cp2.y.toFixed(1)}
                        </div>
                        <div className="text-gray-600">
                          下まぶたCP1: x={eyeState.lowerEyelid.cp1.x.toFixed(1)}
                          , y={eyeState.lowerEyelid.cp1.y.toFixed(1)}
                        </div>
                        <div className="text-gray-600">
                          下まぶたCP2: x={eyeState.lowerEyelid.cp2.x.toFixed(1)}
                          , y={eyeState.lowerEyelid.cp2.y.toFixed(1)}
                        </div>
                        <div className="text-gray-600">
                          虹彩中心: x={eyeState.iris.x}, y={eyeState.iris.y}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                    {/* SVG Export - Temporarily disabled
                    <button
                      onClick={handleExportSVG}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                      SVGとして書き出し
                    </button>
                    */}
                    <button
                      onClick={resetEyeToDefault}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                      リセット
                    </button>
                  </div>
                </div>
              ) : (
                /* Texture Controls */
                <div className="bg-white p-6 rounded-xl border border-gray-200 h-full flex flex-col gap-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800">
                    テクスチャ設定
                  </h3>

                  <div className="flex-1 space-y-4 overflow-y-auto">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        毛の密度: {textureSettings.density}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="255"
                        value={textureSettings.density}
                        onChange={(e) =>
                          updateTextureSetting(
                            "density",
                            Number(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        毛の長さ: {textureSettings.lineLength}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={textureSettings.lineLength}
                        onChange={(e) =>
                          updateTextureSetting(
                            "lineLength",
                            Number(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        毛の角度: {textureSettings.angleScale}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="255"
                        value={textureSettings.angleScale}
                        onChange={(e) =>
                          updateTextureSetting(
                            "angleScale",
                            Number(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ブラシ半径: {textureSettings.brushRadius}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="200"
                        value={textureSettings.brushRadius}
                        onChange={(e) =>
                          updateTextureSetting(
                            "brushRadius",
                            Number(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="border-t border-gray-200" />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ブラシ色
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={textureSettings.brushColor}
                          onChange={(e) =>
                            updateTextureSetting("brushColor", e.target.value)
                          }
                          className="w-10 h-10 border-none rounded-md cursor-pointer"
                        />
                        <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                          {textureSettings.brushColor.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        毛色
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={textureSettings.baseColor}
                          onChange={(e) =>
                            updateTextureSetting("baseColor", e.target.value)
                          }
                          className="w-10 h-10 border-none rounded-md cursor-pointer"
                        />
                        <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                          {textureSettings.baseColor.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        背景色
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={textureSettings.backgroundColor}
                          onChange={(e) =>
                            updateTextureSetting(
                              "backgroundColor",
                              e.target.value
                            )
                          }
                          className="w-10 h-10 border-none rounded-md cursor-pointer"
                        />
                        <div className="text-center font-mono bg-gray-100 rounded p-2 text-sm text-gray-600 border border-gray-200">
                          {textureSettings.backgroundColor.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                    <button
                      onClick={resetTextureSettings}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                      ブラシリセット (R)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
