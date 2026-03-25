"use client";

import React, {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {P5Wrapper} from "./P5Wrapper";
import {createUnifiedEditorSketch} from "./UnifiedEditorSketch";
import {EyeControls} from "./EyeControls";
import {TextureControls} from "./TextureControls";
import {DevSettingsModal} from "./DevSettingsModal";
import type {
  EyeState,
  HandleModes,
  TextureSettings,
  EditorMode,
  NoseSettings,
  EdgeFurSettings,
} from "../types";
import {
  buildSaveData,
  serializeSaveData,
  downloadSaveFile,
  parseSaveFile,
  openFilePicker,
} from "./SaveLoad";
import {useUndoRedo, type UndoRedoState} from "./useUndoRedo";

const INIT_TEXTURE_SETTINGS: TextureSettings = {
  density: 60,
  lineLength: 66,
  angleScale: 255,
  weight: 1,
  brushRadius: 37,
  brushColor: "#ff7b00",
  backgroundColor: "#f5f5f5",
};

const INIT_EYE_STATE: EyeState = {
  innerCorner: {x: -66.26568339566096, y: 177.29230337807354},
  outerCorner: {x: 59.783007794463956, y: 211.55602999459944},
  upperEyelid: {cp1: {x: -50.53080477908028, y: 126.4380241208296}, cp2: {x: 66.3, y: 175.0}},
  lowerEyelid: {cp1: {x: -86.75289106223163, y: 243.50585387722185}, cp2: {x: 51.3, y: 258.8}},
  iris: {x: 0, y: 182.5, w: 161, h: 161, color: "#ffcc02"},
  pupil: {x: 0, y: 182.5, w: 115, h: 115},
};

const INIT_NOSE_SETTINGS: NoseSettings = {
  y: 275,
  scale: 1.1,
  color: "#171717",
};

const DEFAULT_STYLE_PATH = "/catseye_1773808058634.catseye.json";

const INIT_EDGE_FUR_SETTINGS: EdgeFurSettings = {
  enabled: false,
  falloffBase: 80,
  falloffWave: 25,
  waveScale: 120,
  cornerRadius: 60,
};

interface UnifiedEditorProps {
  circlePosition?: {x: number; y: number} | null;
  isCircleActive?: boolean;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  circlePosition = null,
  isCircleActive = false,
}) => {
  const [showDevModal, setShowDevModal] = useState(false);
  const [activeMode, setActiveMode] = useState<EditorMode>("eye");
  const [canvasSize, setCanvasSize] = useState({width: 960, height: 540});
  const [drawSize, setDrawSize] = useState({width: 800, height: 450});
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canvasPosition, setCanvasPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Texture settings
  const [textureSettings, setTextureSettings] = useState<TextureSettings>(
    INIT_TEXTURE_SETTINGS,
  );

  // Palette colors management
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  const [colorReplaceRequest, setColorReplaceRequest] = useState<{
    oldColor: string;
    newColor: string;
  } | null>(null);

  // Export/Import state
  const [exportRequest, setExportRequest] = useState<{requestId: number} | null>(null);
  const [importColorMapRequest, setImportColorMapRequest] = useState<{dataUrl: string; requestId: number} | null>(null);
  const skipConstraintEffectRef = useRef(false);

  // Eye settings
  const [eyeballRadius, setEyeballRadius] = useState(115);
  const [k_anchorConstraint, setK_anchorConstraint] = useState(0.578);
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
  const [irisColor, setIrisColor] = useState("#ffcc02");
  const [eyeballColor, setEyeballColor] = useState("#e6e6e6");
  const [animationStatus, setAnimationStatus] = useState("idle");
  const [eyeSpacing, setEyeSpacing] = useState(350);
  const [isPupilTracking, setIsPupilTracking] = useState(false);

  // デフォルトスタイルのカラーマップを読み込む
  useEffect(() => {
    fetch(DEFAULT_STYLE_PATH)
      .then((res) => res.json())
      .then((data) => {
        if (data.colorMapDataUrl) {
          setImportColorMapRequest({
            dataUrl: data.colorMapDataUrl,
            requestId: Date.now(),
          });
        }
      })
      .catch((e) => console.error("Failed to load default style:", e));
  }, []);

  // 円が通過中の場合のみ目線追従を有効にする
  useEffect(() => {
    setIsPupilTracking(isCircleActive);
  }, [isCircleActive]);

  // ページ全体の背景色を設定
  useEffect(() => {
    document.documentElement.style.backgroundColor =
      textureSettings.backgroundColor;
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
  const [pupilWidthRatio, setPupilWidthRatio] = useState(0.5732134806131649);

  // Edge fur settings (dev feature)
  const [edgeFurSettings, setEdgeFurSettings] = useState<EdgeFurSettings>(INIT_EDGE_FUR_SETTINGS);

  // Undo / Redo
  const {pushState, undo, redo, finishRestore, canUndo, canRedo} = useUndoRedo();
  const getColorMapDataUrlRef = useRef<(() => string | null) | null>(null);

  const collectState = useCallback((): UndoRedoState => ({
    eyeState,
    irisColor,
    eyeballColor,
    eyeballRadius,
    eyeSpacing,
    k_anchorConstraint,
    l_irisConstraint,
    m_irisScale,
    n_pupilScale,
    pupilWidthRatio,
    noseSettings,
    textureSettings,
    colorMapDataUrl: getColorMapDataUrlRef.current?.() ?? null,
  }), [
    eyeState, irisColor, eyeballColor, eyeballRadius, eyeSpacing,
    k_anchorConstraint, l_irisConstraint, m_irisScale, n_pupilScale,
    pupilWidthRatio, noseSettings, textureSettings,
  ]);

  const restoreState = useCallback((s: UndoRedoState) => {
    skipConstraintEffectRef.current = true;
    setEyeState(s.eyeState as EyeState);
    setIrisColor(s.irisColor);
    setEyeballColor(s.eyeballColor);
    setEyeballRadius(s.eyeballRadius);
    setEyeSpacing(s.eyeSpacing);
    setK_anchorConstraint(s.k_anchorConstraint);
    setL_irisConstraint(s.l_irisConstraint);
    setM_irisScale(s.m_irisScale);
    setN_pupilScale(s.n_pupilScale);
    setPupilWidthRatio(s.pupilWidthRatio);
    setNoseSettings(s.noseSettings as NoseSettings);
    setTextureSettings(s.textureSettings as TextureSettings);
    // Restore colorMap
    if (s.colorMapDataUrl) {
      setImportColorMapRequest({
        dataUrl: s.colorMapDataUrl,
        requestId: Date.now(),
      });
    }
    // Allow next state change to be recorded
    requestAnimationFrame(() => finishRestore());
  }, [finishRestore]);

  // Push state on every meaningful change (debounced)
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushState(collectState());
    }, 300);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [collectState, pushState]);

  // Snapshot on interaction end (mouseUp in sketch)
  const handleInteractionEnd = useCallback(() => {
    pushState(collectState());
  }, [pushState, collectState]);

  const handleUndo = useCallback(() => {
    const s = undo();
    if (s) restoreState(s);
  }, [undo, restoreState]);

  const handleRedo = useCallback(() => {
    const s = redo();
    if (s) restoreState(s);
  }, [redo, restoreState]);

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

        // Canvas fills container exactly (no overflow)
        const aspectRatio = 16 / 9;
        let canvasWidth = containerWidth;
        let canvasHeight = canvasWidth / aspectRatio;

        // Cap canvas height so canvas + controls fit within viewport
        // 280px reserved for: header(60) + padding(32) + gap(8) + controls(~160) + margin
        const maxCanvasHeight = window.innerHeight - 280;
        if (canvasHeight > maxCanvasHeight) {
          canvasHeight = maxCanvasHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }

        // Canvas fills container, draw area has 10% margin on each side
        setCanvasSize({
          width: Math.floor(canvasWidth),
          height: Math.floor(canvasHeight),
        });

        setDrawSize({
          width: Math.floor(canvasWidth / 1.2),
          height: Math.floor(canvasHeight / 1.2),
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

  // マウス移動で表示、3秒間動きがなければ非表示
  useEffect(() => {
    const HIDE_DELAY = 3000;
    const showControls = () => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
    };
    window.addEventListener("mousemove", showControls);
    return () => {
      window.removeEventListener("mousemove", showControls);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Ctrl+Shift+D で開発者設定モーダルをトグル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setShowDevModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onBlinkFinish = useCallback(() => setAnimationStatus("idle"), []);

  useEffect(() => {
    if (skipConstraintEffectRef.current) {
      skipConstraintEffectRef.current = false;
      return;
    }
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
    value: TextureSettings[K],
  ) => {
    setTextureSettings((prev) => ({...prev, [key]: value}));
  };

  const handlePaletteColorsUpdate = useCallback((colors: string[]) => {
    setPaletteColors(colors);
  }, []);

  const handleReplacePaletteColor = useCallback(
    (oldColor: string, newColor: string) => {
      setColorReplaceRequest({oldColor, newColor});
      // リクエストを処理した後、少し遅延してクリア（処理が確実に完了するまで待つ）
      setTimeout(() => {
        setColorReplaceRequest(null);
      }, 200);
    },
    [],
  );

  // Export: colorMapの抽出コールバック
  const handleExportReady = useCallback(
    (data: {colorMapDataUrl: string | null}) => {
      const saveData = buildSaveData({
        eyeState,
        irisColor,
        eyeballColor,
        eyeballRadius,
        eyeSpacing,
        k_anchorConstraint,
        l_irisConstraint,
        m_irisScale,
        n_pupilScale,
        pupilWidthRatio,
        noseSettings,
        textureSettings,
        colorMapDataUrl: data.colorMapDataUrl,
      });
      const json = serializeSaveData(saveData);
      downloadSaveFile(json);
      setExportRequest(null);
    },
    [
      eyeState, irisColor, eyeballColor, eyeballRadius, eyeSpacing,
      k_anchorConstraint, l_irisConstraint, m_irisScale, n_pupilScale,
      pupilWidthRatio, noseSettings, textureSettings,
    ],
  );

  const handleExport = useCallback(() => {
    setExportRequest({requestId: Date.now()});
  }, []);

  const handleImport = useCallback(async () => {
    const file = await openFilePicker();
    if (!file) return;

    try {
      const data = await parseSaveFile(file);

      // Skip constraint effect to avoid overwriting imported eyeState
      skipConstraintEffectRef.current = true;

      // Restore all state
      setEyeState(data.eyeState);
      setIrisColor(data.irisColor);
      setEyeballColor(data.eyeballColor);
      setEyeballRadius(data.eyeballRadius);
      setEyeSpacing(data.eyeSpacing);
      setK_anchorConstraint(data.k_anchorConstraint);
      setL_irisConstraint(data.l_irisConstraint);
      setM_irisScale(data.m_irisScale);
      setN_pupilScale(data.n_pupilScale);
      setPupilWidthRatio(data.pupilWidthRatio);
      setNoseSettings(data.noseSettings);
      setTextureSettings(data.textureSettings);

      // Restore colorMap if present
      if (data.colorMapDataUrl) {
        setImportColorMapRequest({
          dataUrl: data.colorMapDataUrl,
          requestId: Date.now(),
        });
      }
    } catch (e) {
      console.error("Failed to import save file:", e);
      alert("ファイルの読み込みに失敗しました。");
    }
  }, []);

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
    setK_anchorConstraint(0.578);
    setL_irisConstraint(0.95);
    setM_irisScale(0.7);
    setN_pupilScale(0.5);
    setEyeState(INIT_EYE_STATE);
    setHandleModes({inner: true, outer: true});
    setIrisColor("#ffcc02");
    setEyeballColor("#e6e6e6");
    setEyeSpacing(350);
    setNoseSettings(INIT_NOSE_SETTINGS);
    setPupilWidthRatio(0.5732134806131649);
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Canvas and Controls */}
      <div>
        <div
          className="mx-auto py-4"
          style={{
            width: "80vw",
            maxWidth: "1600px",
            minWidth: "320px",
          }}
        >
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Canvas */}
            <div ref={canvasContainerRef} className="w-full">
              <div
                className="mx-auto"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
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
                    m_irisScale={m_irisScale}
                    blinkRatio={blinkRatio}
                    textureSettings={textureSettings}
                    onResetBrush={resetTextureSettings}
                    activeMode={activeMode}
                    noseSettings={noseSettings}
                    setNoseSettings={setNoseSettings}
                    pupilWidthRatio={pupilWidthRatio}
                    setPupilWidthRatio={setPupilWidthRatio}
                    circlePosition={circlePosition}
                    isCircleActive={isCircleActive}
                    canvasPosition={canvasPosition}
                    onPaletteColorsUpdate={handlePaletteColorsUpdate}
                    colorReplaceRequest={colorReplaceRequest}
                    onReplacePaletteColor={handleReplacePaletteColor}
                    exportRequest={exportRequest}
                    onExportReady={handleExportReady}
                    importColorMapRequest={importColorMapRequest}
                    edgeFurSettings={edgeFurSettings}
                    getColorMapDataUrlRef={getColorMapDataUrlRef}
                    onInteractionEnd={handleInteractionEnd}
                  />
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Controls Panel */}
      <div
        style={{
          width: "90vw",
          maxWidth: "1600px",
          margin: "0 auto",
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        <div style={{display: "flex", alignItems: "flex-start", gap: "12px", padding: "8px 16px", justifyContent: "center", flexWrap: "wrap"}}>
          {/* Mode Switch Buttons */}
          <button
            onClick={() => setActiveMode("eye")}
            style={{
              background: activeMode === "eye" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              border: "none",
              borderRadius: "6px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <img
              src="/eye-button.svg"
              alt="Eye"
              height={20}
              style={{height: "20px", width: "auto", mixBlendMode: "difference", filter: "invert(1)"}}
            />
          </button>
          <button
            onClick={() => setActiveMode("texture")}
            style={{
              background: activeMode === "texture" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              border: "none",
              borderRadius: "6px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <img
              src="/fur-button.svg"
              alt="Fur"
              height={20}
              style={{height: "20px", width: "auto", mixBlendMode: "difference", filter: "invert(1)"}}
            />
          </button>

          {/* Inline Controls */}
          {activeMode === "eye" ? (
            <EyeControls
              eyeballColor={eyeballColor}
              setEyeballColor={setEyeballColor}
              irisColor={irisColor}
              setIrisColor={setIrisColor}
              noseColor={noseSettings.color}
              setNoseColor={(color) => setNoseSettings((prev) => ({...prev, color}))}
            />
          ) : (
            <TextureControls
              textureSettings={textureSettings}
              updateTextureSetting={updateTextureSetting}
              paletteColors={paletteColors}
              onReplacePaletteColor={handleReplacePaletteColor}
            />
          )}

          {/* Spacer */}
          <div style={{flex: 1}} />

          {/* Undo / Redo */}
          <div style={{display: "flex", gap: "12px", flexShrink: 0, mixBlendMode: "difference"}}>
            <button
              onClick={handleUndo}
              style={{
                background: "none",
                border: "none",
                cursor: canUndo() ? "pointer" : "default",
                padding: 0,
                opacity: canUndo() ? 1 : 0.3,
              }}
            >
              <img src="/undo.svg" alt="Undo" width={28} height={28} />
            </button>
            <button
              onClick={handleRedo}
              style={{
                background: "none",
                border: "none",
                cursor: canRedo() ? "pointer" : "default",
                padding: 0,
                opacity: canRedo() ? 1 : 0.3,
              }}
            >
              <img src="/redo.svg" alt="Redo" width={28} height={28} />
            </button>
          </div>
        </div>
      </div>
      {showDevModal && (
        <DevSettingsModal
          eyeState={eyeState}
          noseSettings={noseSettings}
          eyeSpacing={eyeSpacing}
          eyeballRadius={eyeballRadius}
          k_anchorConstraint={k_anchorConstraint}
          onExport={handleExport}
          onImport={handleImport}
          onClose={() => setShowDevModal(false)}
          edgeFurSettings={edgeFurSettings}
          onEdgeFurSettingsChange={setEdgeFurSettings}
        />
      )}
    </div>
  );
};
