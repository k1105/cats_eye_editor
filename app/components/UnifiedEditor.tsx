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

interface UnifiedEditorProps {
  circlePosition?: {x: number; y: number} | null;
  isCircleActive?: boolean;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  circlePosition = null,
  isCircleActive = false,
}) => {
  const [activeMode, setActiveMode] = useState<EditorMode>("eye");
  const [canvasSize, setCanvasSize] = useState({width: 800, height: 450});
  const [drawSize, setDrawSize] = useState({width: 800, height: 450});
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasPosition, setCanvasPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Texture settings
  const [textureSettings, setTextureSettings] = useState<TextureSettings>(
    INIT_TEXTURE_SETTINGS
  );

  // Brush colors management
  const [usedBrushColors, setUsedBrushColors] = useState<string[]>([]);
  const [colorReplaceRequest, setColorReplaceRequest] = useState<{
    oldColor: string;
    newColor: string;
  } | null>(null);

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

  // 円が通過中の場合のみ目線追従を有効にする
  useEffect(() => {
    setIsPupilTracking(isCircleActive);
  }, [isCircleActive]);

  // ページ全体の背景色を設定
  useEffect(() => {
    document.documentElement.style.backgroundColor = textureSettings.backgroundColor;
    document.body.style.backgroundColor = textureSettings.backgroundColor;
    // クリーンアップ時に元の背景色に戻す（オプション）
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, [textureSettings.backgroundColor]);

  // Nose settings
  const [noseSettings, setNoseSettings] =
    useState<NoseSettings>(INIT_NOSE_SETTINGS);

  // Pupil width (1.0 = circle, 0.1 = narrow cat eye)
  const [pupilWidthRatio, setPupilWidthRatio] = useState(0.46);

  useEffect(() => {
    const updateCanvasPosition = () => {
      if (canvasContainerRef.current) {
        const canvasElement =
          canvasContainerRef.current.querySelector("canvas");
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          // getBoundingClientRect()はviewport座標を返す
          // スクロール位置は自動的に考慮される
          setCanvasPosition({x: rect.left, y: rect.top});
        }
      }
    };

    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.offsetWidth;
        const containerHeight = canvasContainerRef.current.offsetHeight;

        // Maintain 4:3 aspect ratio (800:600) for draw size (virtual canvas)
        const aspectRatio = 8 / 5;
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

        // Update canvas position after a short delay to ensure canvas is rendered
        setTimeout(updateCanvasPosition, 100);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateCanvasPosition);

    // Update canvas position periodically to handle dynamic changes
    const positionInterval = setInterval(updateCanvasPosition, 50);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateCanvasPosition);
      clearInterval(positionInterval);
    };
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

      // 目頭・目尻の移動前の位置を保存
      const oldInnerCorner = {x: prev.innerCorner.x, y: prev.innerCorner.y};
      const oldOuterCorner = {x: prev.outerCorner.x, y: prev.outerCorner.y};

      // 目頭・目尻を新しい位置に投影
      newState.innerCorner = projectOnCircle(newState.innerCorner);
      newState.outerCorner = projectOnCircle(newState.outerCorner);

      // 目頭・目尻の移動差分を計算
      const innerDelta = {
        x: newState.innerCorner.x - oldInnerCorner.x,
        y: newState.innerCorner.y - oldInnerCorner.y,
      };
      const outerDelta = {
        x: newState.outerCorner.x - oldOuterCorner.x,
        y: newState.outerCorner.y - oldOuterCorner.y,
      };

      // ベジェ曲線の操作ハンドルを平行移動
      newState.upperEyelid.cp1.x += innerDelta.x;
      newState.upperEyelid.cp1.y += innerDelta.y;
      newState.lowerEyelid.cp1.x += innerDelta.x;
      newState.lowerEyelid.cp1.y += innerDelta.y;
      newState.upperEyelid.cp2.x += outerDelta.x;
      newState.upperEyelid.cp2.y += outerDelta.y;
      newState.lowerEyelid.cp2.x += outerDelta.x;
      newState.lowerEyelid.cp2.y += outerDelta.y;

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

  const handleBrushColorsUpdate = useCallback((colors: string[]) => {
    setUsedBrushColors(colors);
  }, []);

  const handleReplaceBrushColor = useCallback(
    (oldColor: string, newColor: string) => {
      setColorReplaceRequest({oldColor, newColor});
      // リクエストを処理した後、少し遅延してクリア（処理が確実に完了するまで待つ）
      setTimeout(() => {
        setColorReplaceRequest(null);
      }, 200);
    },
    []
  );

  // 色のリストを初期化時に取得
  useEffect(() => {
    if (activeMode === "texture") {
      // 初期化時に色のリストを取得するため、少し遅延させる
      const timer = setTimeout(() => {
        // この処理はUnifiedEditorSketch側で自動的に行われる
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeMode]);

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
                    zIndex: "0",
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
                    setAnimationStatus={setAnimationStatus}
                    eyeSpacing={eyeSpacing}
                    setEyeSpacing={setEyeSpacing}
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
                    setNoseSettings={setNoseSettings}
                    pupilWidthRatio={pupilWidthRatio}
                    circlePosition={circlePosition}
                    isCircleActive={isCircleActive}
                    canvasPosition={canvasPosition}
                    onBrushColorsUpdate={handleBrushColorsUpdate}
                    colorReplaceRequest={colorReplaceRequest}
                    onReplaceBrushColor={handleReplaceBrushColor}
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
                  usedBrushColors={usedBrushColors}
                  onReplaceBrushColor={handleReplaceBrushColor}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
