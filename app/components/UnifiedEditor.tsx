"use client";

import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {P5Wrapper} from "./P5Wrapper";
import {createUnifiedEditorSketch} from "./UnifiedEditorSketch";
import {EyeControls} from "./EyeControls";
import {TextureControls} from "./TextureControls";
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
          className="mx-auto py-8 sm:py-12 lg:py-16"
          style={{
            minHeight: "calc(100vh - 120px)",
            width: "90vw",
            maxWidth: "2000px",
          }}
        >
          <div
            className="flex flex-col lg:flex-row gap-10 w-full"
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
                <EyeControls
                  activeMode={activeMode}
                  onModeChange={setActiveMode}
                  eyeState={eyeState}
                  eyeballRadius={eyeballRadius}
                  setEyeballRadius={setEyeballRadius}
                  eyeSpacing={eyeSpacing}
                  setEyeSpacing={setEyeSpacing}
                  eyeballColor={eyeballColor}
                  setEyeballColor={setEyeballColor}
                  irisColor={irisColor}
                  setIrisColor={setIrisColor}
                  pupilWidthRatio={pupilWidthRatio}
                  setPupilWidthRatio={setPupilWidthRatio}
                  noseSettings={noseSettings}
                  setNoseSettings={setNoseSettings}
                  isPreview={isPreview}
                  setIsPreview={setIsPreview}
                  animationStatus={animationStatus}
                  setAnimationStatus={setAnimationStatus}
                  onReset={resetEyeToDefault}
                />
              ) : (
                <TextureControls
                  activeMode={activeMode}
                  onModeChange={setActiveMode}
                  textureSettings={textureSettings}
                  updateTextureSetting={updateTextureSetting}
                  onReset={resetTextureSettings}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
