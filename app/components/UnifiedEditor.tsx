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
  innerCorner: {x: -66.26568339566096, y: 197.29230337807354},
  outerCorner: {x: 59.783007794463956, y: 231.55602999459944},
  upperEyelid: {
    cp1: {x: -50.53080477908028, y: 146.4380241208296},
    cp2: {x: 66.3, y: 195.0},
  },
  lowerEyelid: {
    cp1: {x: -86.75289106223163, y: 263.50585387722185},
    cp2: {x: 51.3, y: 278.8},
  },
  iris: {x: 0, y: 202.5, w: 161, h: 161, color: "#ffcc02"},
  pupil: {x: 0, y: 202.5, w: 115, h: 115},
};

const INIT_NOSE_SETTINGS: NoseSettings = {
  y: 295,
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
  editMode?: boolean;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  circlePosition = null,
  isCircleActive = false,
  editMode = false,
}) => {
  const [showDevModal, setShowDevModal] = useState(false);
  const [activeMode, setActiveMode] = useState<EditorMode>("eye");
  const pickerOpenCountRef = useRef(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const handlePickerOpenChange = useCallback((open: boolean) => {
    pickerOpenCountRef.current += open ? 1 : -1;
    setIsPickerOpen(pickerOpenCountRef.current > 0);
  }, []);
  const [canvasSize, setCanvasSize] = useState({width: 960, height: 540});
  const [drawSize, setDrawSize] = useState({width: 800, height: 450});
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [tempHidden, setTempHidden] = useState(false);
  const panelVisible = controlsVisible && !tempHidden;

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
  const [exportRequest, setExportRequest] = useState<{
    requestId: number;
  } | null>(null);
  const [importColorMapRequest, setImportColorMapRequest] = useState<{
    dataUrl: string;
    requestId: number;
  } | null>(null);
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
  const [edgeFurSettings, setEdgeFurSettings] = useState<EdgeFurSettings>(
    INIT_EDGE_FUR_SETTINGS,
  );

  // Undo / Redo
  const {pushState, undo, redo, finishRestore, canUndo, canRedo} =
    useUndoRedo();
  const getColorMapDataUrlRef = useRef<(() => string | null) | null>(null);

  const collectState = useCallback(
    (): UndoRedoState => ({
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
    }),
    [
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
    ],
  );

  const restoreState = useCallback(
    (s: UndoRedoState) => {
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
    },
    [finishRestore],
  );

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

        // Cap canvas height to 70% of viewport
        const maxCanvasHeight = window.innerHeight * 0.7;
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

  // editMode propでコントロール表示を制御
  useEffect(() => {
    setControlsVisible(editMode);
  }, [editMode]);

  // ブラシでドラッグ中、カーソルがパネル付近に近づいたら一時的に閉じる
  useEffect(() => {
    if (!editMode || activeMode !== "texture") return;
    let dragging = false;
    const APPROACH_THRESHOLD = 80; // パネル左端から内側のpx

    const getPanelLeft = () => {
      const el = document.querySelector(".edit-panel") as HTMLElement | null;
      if (!el) return window.innerWidth;
      // tempHiddenでtranslateX(100%)中はrectが画面外。常に表示時のleftが欲しいので
      // viewport幅 - panel幅 で算出（パネル幅はCSS変数から）
      const panelWidthStr = getComputedStyle(document.documentElement)
        .getPropertyValue("--edit-panel-width")
        .trim();
      const panelWidth = parseFloat(panelWidthStr) || el.offsetWidth;
      return window.innerWidth - panelWidth;
    };

    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const panelEl = document.querySelector(".edit-panel");
      if (panelEl && target && panelEl.contains(target)) return; // パネル上のクリックは対象外
      dragging = true;
    };
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return;
      const panelLeft = getPanelLeft();
      setTempHidden(e.clientX > panelLeft - APPROACH_THRESHOLD);
    };
    const handleUp = () => {
      dragging = false;
      setTempHidden(false);
    };

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      setTempHidden(false);
    };
  }, [editMode, activeMode]);

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
      const anchorRadiusForIris = eyeballRadius * k_anchorConstraint;
      const irisRadius = anchorRadiusForIris * 0.95;
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
    <div className="w-full h-screen" style={{position: "relative"}}>
      {/* Canvas Area - centered in full viewport (パネル開閉に依らず固定) */}
      <div
        ref={canvasContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            pointerEvents: isPickerOpen ? "none" : "auto",
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
            isPickerOpen={isPickerOpen}
          />
        </div>
      </div>

      {/* パネル背景（panel外に配置 — panel内部は stacking context で blend isolate されるため） */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "var(--edit-panel-width)",
          background: "#eee",
          mixBlendMode: "luminosity",
          transform: panelVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: "none",
          zIndex: 199,
        }}
      />

      {/* Right Side Controls Panel */}
      <div
        className="edit-panel"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "var(--edit-panel-width)",
          color: "#231616",
          padding: "16px calc(var(--grid-col) * 0.5) 24px",
          overflowY: "auto",
          transform: panelVisible ? "translateX(0)" : "translateX(100%)",
          pointerEvents: panelVisible ? "auto" : "none",
          transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          zIndex: 200,
        }}
      >
        {/* Close button */}
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("request-close-edit"))
          }
          aria-label="Close"
          style={{
            position: "absolute",
            top: "12px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            fontSize: "28px",
            lineHeight: 1,
            color: "#231616",
          }}
        >
          ×
        </button>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            paddingTop: "32px",
            fontSize: "13px",
          }}
        >
          <span style={{color: "#bbb"}}>|</span>
          <button
            onClick={() => setActiveMode("eye")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "13px",
              fontWeight: 500,
              color: activeMode === "eye" ? "#231616" : "#bbb",
            }}
          >
            Eye &amp; Nose
          </button>
          <span style={{color: "#bbb"}}>|</span>
          <button
            onClick={() => setActiveMode("texture")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "13px",
              fontWeight: 500,
              color: activeMode === "texture" ? "#231616" : "#bbb",
            }}
          >
            Fur
          </button>
          <span style={{color: "#bbb"}}>|</span>
        </div>

        {/* Controls */}
        <div style={{flex: 1}}>
          {activeMode === "eye" ? (
            <EyeControls
              eyeballColor={eyeballColor}
              setEyeballColor={setEyeballColor}
              irisColor={irisColor}
              setIrisColor={setIrisColor}
              noseColor={noseSettings.color}
              setNoseColor={(color) =>
                setNoseSettings((prev) => ({...prev, color}))
              }
              vertical
            />
          ) : (
            <TextureControls
              textureSettings={textureSettings}
              updateTextureSetting={updateTextureSetting}
              paletteColors={paletteColors}
              onReplacePaletteColor={handleReplacePaletteColor}
              onPickerOpenChange={handlePickerOpenChange}
              vertical
            />
          )}
        </div>

        {/* Bottom navigation (Undo / Redo) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            fontSize: "18px",
          }}
        >
          <button
            onClick={handleUndo}
            aria-label="Undo"
            style={{
              background: "none",
              border: "none",
              cursor: canUndo() ? "pointer" : "default",
              padding: 0,
              opacity: canUndo() ? 1 : 0.3,
              color: "#231616",
            }}
          >
            ◀
          </button>
          <button
            onClick={handleRedo}
            aria-label="Redo"
            style={{
              background: "none",
              border: "none",
              cursor: canRedo() ? "pointer" : "default",
              padding: 0,
              opacity: canRedo() ? 1 : 0.3,
              color: "#231616",
            }}
          >
            ▶
          </button>
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
