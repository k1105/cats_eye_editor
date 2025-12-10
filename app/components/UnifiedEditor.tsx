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
  density: 60,
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

interface TabButtonsProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

interface ColorChipProps {
  value: string;
  onChange: (value: string) => void;
}

const ColorChip: React.FC<ColorChipProps> = ({value, onChange}) => {
  return (
    <div
      style={{
        maxWidth: "80px",
        aspectRatio: "2 / 1",
        border: "0.75px solid var(--border-color)",
        overflow: "hidden",
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

const TabButtons: React.FC<TabButtonsProps> = ({activeMode, onModeChange}) => {
  return (
    <div className="flex">
      <button
        onClick={() => onModeChange("eye")}
        className="py-2.5 text-sm font-semibold transition-all duration-200 flex-1"
        style={{
          backgroundColor: activeMode === "eye" ? "#f9cb9b" : "#fbbf24",
          color: "var(--text-color)",
          borderRight:
            activeMode === "eye" ? "0.75px solid var(--border-color)" : "none",
          borderBottom: "none",
        }}
      >
        Eye
      </button>
      <button
        onClick={() => onModeChange("texture")}
        className="py-2.5 text-sm font-semibold transition-all duration-200 flex-1"
        style={{
          backgroundColor: activeMode === "texture" ? "#f9cb9b" : "#fbbf24",
          color: "var(--text-color)",
          borderBottom: "none",
          borderLeft:
            activeMode === "texture"
              ? "0.75px solid var(--border-color)"
              : "none",
        }}
      >
        Other
      </button>
    </div>
  );
};

export const UnifiedEditor: React.FC = () => {
  const [activeMode, setActiveMode] = useState<EditorMode>("eye");
  const [canvasSize, setCanvasSize] = useState({width: 800, height: 600});
  const [drawSize, setDrawSize] = useState({width: 800, height: 600});
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
  const blinkRatio = 0.47;
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

  // プレビューモードの場合は目線追従を常に有効にする
  useEffect(() => {
    setIsPupilTracking(isPreview);
  }, [isPreview]);

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

        // Maintain 4:3 aspect ratio (800:600) for draw size (virtual canvas)
        const aspectRatio = 4 / 3;
        let drawWidth = containerWidth;
        let drawHeight = drawWidth / aspectRatio;

        // If height exceeds container, adjust based on height
        if (drawHeight > containerHeight) {
          drawHeight = containerHeight;
          drawWidth = drawHeight * aspectRatio;
        }

        // Draw size is the virtual canvas (actual drawing area)
        const newDrawSize = {
          width: Math.floor(drawWidth),
          height: Math.floor(drawHeight),
        };
        setDrawSize(newDrawSize);

        // Canvas size is 20% larger (10% on each side)
        setCanvasSize({
          width: Math.floor(newDrawSize.width * 1.2),
          height: Math.floor(newDrawSize.height * 1.2),
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
    setNoseSettings(INIT_NOSE_SETTINGS);
    setPupilWidthRatio(0.35);
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Canvas and Controls */}
      <div className="flex-1">
        <div
          className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-16 px-2 sm:px-3 lg:px-4"
          style={{minHeight: "calc(100vh - 120px)"}}
        >
          <div
            className="flex flex-col lg:flex-row gap-4 w-full"
            style={{minHeight: "calc(100vh - 120px)"}}
          >
            {/* Canvas */}
            <div ref={canvasContainerRef} className="flex-1 min-w-0 min-h-0">
              <div
                className="relative"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    zIndex: "-1",
                    top: "-10%",
                    left: "-10%",
                    width: "80%",
                    height: "80%",
                    pointerEvents: "auto",
                  }}
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
                    drawSize={drawSize}
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
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-80 flex-shrink-0">
              {activeMode === "eye" ? (
                /* Eye Controls */
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
                  <TabButtons
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
                  <div
                    className="p-6 flex-1 flex flex-col gap-4"
                    style={{overflowY: "scroll"}}
                  >
                    <div className="flex items-center justify-between">
                      <label
                        className="text-sm font-medium"
                        style={{color: "var(--text-color)"}}
                      >
                        プレビュー
                      </label>
                      <button
                        onClick={() => setIsPreview((prev) => !prev)}
                        className={`relative inline-flex h-6 w-11 items-center transition-colors duration-200 focus:outline-none ${
                          isPreview ? "bg-yellow-400" : "bg-gray-300"
                        }`}
                        style={{border: "0.75px solid var(--border-color)"}}
                        role="switch"
                        aria-checked={isPreview}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform bg-white transition-transform duration-200 ${
                            isPreview ? "translate-x-6" : "translate-x-1"
                          }`}
                          style={{border: "0.75px solid var(--border-color)"}}
                        />
                      </button>
                    </div>

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
                          animationStatus === "blinking"
                            ? "bg-yellow-400"
                            : "bg-gray-300"
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
                          onChange={(e) =>
                            setEyeballRadius(Number(e.target.value))
                          }
                          className="w-full cursor-pointer"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{color: "var(--text-color)"}}
                        >
                          眉間の間隔: {eyeSpacing}
                        </label>
                        <input
                          type="range"
                          min="350"
                          max="600"
                          value={eyeSpacing}
                          onChange={(e) =>
                            setEyeSpacing(Number(e.target.value))
                          }
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
                        <ColorChip
                          value={eyeballColor}
                          onChange={setEyeballColor}
                        />
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
                          onChange={(e) =>
                            setPupilWidthRatio(Number(e.target.value))
                          }
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
                            目頭: x={eyeState.innerCorner.x}, y=
                            {eyeState.innerCorner.y}
                          </div>
                          <div style={{color: "var(--text-color)"}}>
                            目尻: x={eyeState.outerCorner.x}, y=
                            {eyeState.outerCorner.y}
                          </div>
                          <div style={{color: "var(--text-color)"}}>
                            上まぶたCP1: x=
                            {eyeState.upperEyelid.cp1.x.toFixed(1)}, y=
                            {eyeState.upperEyelid.cp1.y.toFixed(1)}
                          </div>
                          <div style={{color: "var(--text-color)"}}>
                            上まぶたCP2: x=
                            {eyeState.upperEyelid.cp2.x.toFixed(1)}, y=
                            {eyeState.upperEyelid.cp2.y.toFixed(1)}
                          </div>
                          <div style={{color: "var(--text-color)"}}>
                            下まぶたCP1: x=
                            {eyeState.lowerEyelid.cp1.x.toFixed(1)}, y=
                            {eyeState.lowerEyelid.cp1.y.toFixed(1)}
                          </div>
                          <div style={{color: "var(--text-color)"}}>
                            下まぶたCP2: x=
                            {eyeState.lowerEyelid.cp2.x.toFixed(1)}, y=
                            {eyeState.lowerEyelid.cp2.y.toFixed(1)}
                          </div>
                          <div style={{color: "var(--text-color)"}}>
                            虹彩中心: x={eyeState.iris.x}, y={eyeState.iris.y}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                      {/* SVG Export - Temporarily disabled
                    <button
                      onClick={handleExportSVG}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-3 px-4 transition-colors duration-200"
                      style={{ border: '0.75px solid var(--border-color)' }}
                    >
                      SVGとして書き出し
                    </button>
                    */}
                      <button
                        onClick={resetEyeToDefault}
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
              ) : (
                /* Texture Controls */
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
                  <TabButtons
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
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
                            updateTextureSetting(
                              "density",
                              Number(e.target.value)
                            )
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
                            updateTextureSetting(
                              "lineLength",
                              Number(e.target.value)
                            )
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
                            updateTextureSetting(
                              "angleScale",
                              Number(e.target.value)
                            )
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
                            updateTextureSetting(
                              "weight",
                              Number(e.target.value)
                            )
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
                            updateTextureSetting(
                              "brushRadius",
                              Number(e.target.value)
                            )
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
                              onChange={(color) =>
                                updateTextureSetting("baseColor", color)
                              }
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
                        onClick={resetTextureSettings}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
