import type p5Type from "p5";
import type {
  EyeState,
  HandleModes,
  TextureSettings,
  NoseSettings,
} from "../types";
import {createFurDrawing, INIT_FUR_COLOR, type FurDrawingState} from "./FurDrawing";
import {
  drawEyeControls,
  drawNose,
  type EyeDrawingContext,
} from "./EyeDrawing";
import {
  createPupilTrackingState,
  updatePupilOffsets,
  type PupilTrackingState,
} from "./PupilTracking";
import {drawSingleEyePreview} from "./CatFaceRenderer";

interface UnifiedEditorProps {
  eyeState: EyeState;
  setEyeState: React.Dispatch<React.SetStateAction<EyeState>>;
  isPreview: boolean;
  handleModes: HandleModes;
  setHandleModes: React.Dispatch<React.SetStateAction<HandleModes>>;
  animationStatus: string;
  onBlinkFinish: () => void;
  setAnimationStatus: (value: string) => void;
  eyeSpacing: number;
  setEyeSpacing: (value: number) => void;
  isPupilTracking: boolean;
  eyeballColor: string;
  eyeballRadius: number;
  k_anchorConstraint: number;
  setK_anchorConstraint: (value: number) => void;
  l_irisConstraint: number;
  m_irisScale: number;
  blinkRatio: number;
  textureSettings: TextureSettings;
  onResetBrush?: () => void;
  canvasSize: {width: number; height: number};
  drawSize: {width: number; height: number};
  activeMode: "eye" | "texture";
  noseSettings: NoseSettings;
  setNoseSettings: React.Dispatch<React.SetStateAction<NoseSettings>>;
  pupilWidthRatio: number;
  setPupilWidthRatio: (value: number) => void;
  circlePosition?: {x: number; y: number} | null;
  isCircleActive?: boolean;
  canvasPosition?: {x: number; y: number} | null;
  onPaletteColorsUpdate?: (colors: string[]) => void;
  colorReplaceRequest?: {oldColor: string; newColor: string} | null;
  onReplacePaletteColor?: (oldColor: string, newColor: string) => void;
  exportRequest?: {requestId: number} | null;
  onExportReady?: (data: {colorMapDataUrl: string | null}) => void;
  importColorMapRequest?: {dataUrl: string; requestId: number} | null;
}

type P5WithProps = p5Type & {
  updateWithProps?: (newProps: Record<string, unknown>) => void;
};

// --- Constants ---
const CANVAS_OFFSET_RATIO = 0.1;
const BLINK_CLOSE_SPEED = 0.07;
const BLINK_OPEN_SPEED = 0.15;
const BLINK_STAY_DURATION = 1000;
const POINT_RADIUS = 8;
const EYE_DETECTION_RADIUS_RATIO = 2.5;
const CURSOR_STATIONARY_THRESHOLD = 2000;
const FADE_SPEED = 0.05;
const MOUSE_MOVE_THRESHOLD = 2;
const EYE_SPACING_CONTROL_SIZE = 12;
const EYE_SPACING_CONTROL_RADIUS = 15;
const NOSE_CONTROL_SIZE = 12;
const NOSE_CONTROL_RADIUS = 20;
const NOSE_DETECTION_RADIUS = 50;
const PUPIL_SLIDER_WIDTH = 120;
const PUPIL_SLIDER_HEIGHT = 6;
const PUPIL_SLIDER_KNOB_RADIUS = 7;
// 鼻SVG viewBox: 67.29 x 44.59 → 外接円の半径（中心からの最大距離）
const NOSE_BASE_RADIUS = Math.sqrt((67.29 / 2) ** 2 + (44.59 / 2) ** 2);
const REFERENCE_DRAW_WIDTH = 800;
const REFERENCE_DRAW_HEIGHT = 450;

// Utility for deep cloning
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const createUnifiedEditorSketch = () => {
  return (p: p5Type, props: Record<string, unknown>) => {
    const pWithProps = p as P5WithProps;
    let currentProps = props as unknown as UnifiedEditorProps;

    // --- State Management ---
    const furDrawingState: FurDrawingState = {
      gridUsesBase: [],
      gridCustom: [],
      lastNumLines: -1,
      colorMap: null,
      colorMapInitialized: false,
      // キャッシュ描画用
      furLayer: null,
      needsRedraw: true,
      prevSettingsHash: "",
    };

    // Blink State
    let isAnimatingBlink = false;
    let blinkProgress = 0;
    let blinkDirection = 1; // 1: Close, 0: Stay, -1: Open
    let blinkStartState: EyeState | null = null;
    let blinkCloseTime: number | null = null;

    // Pupil Tracking State (per-eye independent tracking)
    const pupilState: PupilTrackingState = createPupilTrackingState();

    // Interaction State
    let draggingPoint: string | null = null;
    let dragOffset = {x: 0, y: 0};
    let initialEyeSpacingOnDrag = 0;
    let initialNoseYOnDrag = 0;
    let lastProcessedColorReplace: {oldColor: string; newColor: string} | null =
      null;
    let needsBrushColorScan = true; // 初回スキャン用にtrueで開始
    let lastExportRequestId: number | null = null;
    let lastImportRequestId: number | null = null;

    // Nose color picker state
    let noseColorPicker: p5Type.Element | null = null;

    // Control Visibility State
    let controlsOpacity = 0;
    let noseControlsOpacity = 0;
    let lastMousePosition = {x: -1, y: -1};
    let lastMouseMoveTime = 0;
    let isCursorNearEye = false;
    let isCursorNearNose = false;
    let isMouseInitialized = false;

    p.setup = () => {
      p.createCanvas(
        currentProps.canvasSize.width,
        currentProps.canvasSize.height
      );
      p.pixelDensity(p.displayDensity());
      p.colorMode(p.RGB);
      p.strokeCap(p.PROJECT);
      // canvas要素の背景を透明に設定
      const canvasElement = (p as any).canvas as HTMLCanvasElement;
      if (canvasElement) {
        canvasElement.style.backgroundColor = "transparent";
      }
    };

    // クリーンアップ処理を追加：Sketchが削除されるときにピッカーも削除する
    const cleanup = () => {
        if (noseColorPicker) {
            noseColorPicker.remove();
            noseColorPicker = null;
        }
    };
    // p5のremove関数をラップ、またはインスタンス破棄時に呼ばれるようにする
    // 注意: p5.jsのインスタンスモードではp.removeの上書きは慎重に行う必要がありますが、
    // Reactラッパーがunmount時にDOMを掃除してくれる場合もあります。
    // ここでは念の為、DOM要素の参照を保持しているので手動削除を用意します。
    const originalRemove = p.remove;
    p.remove = () => {
        cleanup();
        if (originalRemove) originalRemove.call(p);
    };


    pWithProps.updateWithProps = (newProps: Record<string, unknown>) => {
      const typedProps = newProps as unknown as UnifiedEditorProps;

      if (
        currentProps.canvasSize.width !== typedProps.canvasSize.width ||
        currentProps.canvasSize.height !== typedProps.canvasSize.height
      ) {
        p.resizeCanvas(
          typedProps.canvasSize.width,
          typedProps.canvasSize.height
        );
        // キャンバスサイズが変わったら再描画
        furDrawingState.needsRedraw = true;
      }

      // textureSettingsが変更されたら再描画を強制
      if (
        JSON.stringify(currentProps.textureSettings) !==
        JSON.stringify(typedProps.textureSettings)
      ) {
        furDrawingState.needsRedraw = true;
        // prevSettingsHashもリセットして、確実に再描画されるようにする
        furDrawingState.prevSettingsHash = "";
      }

      if (typedProps.animationStatus === "blinking" && !isAnimatingBlink) {
        startBlink(typedProps.eyeState);
      }

      // Export request handling
      if (
        typedProps.exportRequest &&
        typedProps.exportRequest.requestId !== lastExportRequestId
      ) {
        lastExportRequestId = typedProps.exportRequest.requestId;
        let colorMapDataUrl: string | null = null;
        if (furDrawingState.colorMap) {
          const canvas = (furDrawingState.colorMap as any).canvas as HTMLCanvasElement;
          if (canvas) {
            colorMapDataUrl = canvas.toDataURL("image/png");
          }
        }
        typedProps.onExportReady?.({colorMapDataUrl});
      }

      // Import colorMap request handling
      if (
        typedProps.importColorMapRequest &&
        typedProps.importColorMapRequest.requestId !== lastImportRequestId
      ) {
        lastImportRequestId = typedProps.importColorMapRequest.requestId;
        const {dataUrl} = typedProps.importColorMapRequest;

        // Ensure colorMap is initialized
        if (!furDrawingState.colorMap) {
          const graphics = p.createGraphics(REFERENCE_DRAW_WIDTH, REFERENCE_DRAW_HEIGHT);
          graphics.pixelDensity(1);
          graphics.colorMode(p.RGB);
          graphics.noSmooth();
          furDrawingState.colorMap = graphics;
          furDrawingState.colorMapInitialized = true;
        }

        const img = new Image();
        img.onload = () => {
          if (furDrawingState.colorMap) {
            const canvas = (furDrawingState.colorMap as any).canvas as HTMLCanvasElement;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            furDrawingState.needsRedraw = true;
            furDrawingState.prevSettingsHash = "";
            needsBrushColorScan = true;
          }
        };
        img.src = dataUrl;
      }

      currentProps = typedProps;
    };

    // --- Coordinate Helpers ---
    const getCanvasOffset = () => ({
      x: currentProps.canvasSize.width * CANVAS_OFFSET_RATIO,
      y: currentProps.canvasSize.height * CANVAS_OFFSET_RATIO,
    });

    const getScaleFactor = () =>
      currentProps.drawSize.width / REFERENCE_DRAW_WIDTH;

    const getReferenceDrawSize = () => ({
      width: REFERENCE_DRAW_WIDTH,
      height: REFERENCE_DRAW_HEIGHT,
    });

    const getDrawAreaCenter = () => ({
      x: REFERENCE_DRAW_WIDTH / 2,
      y: REFERENCE_DRAW_HEIGHT / 2,
    });

    const transformMouseToDrawArea = (mouseX: number, mouseY: number) => {
      const offset = getCanvasOffset();
      const scale = getScaleFactor();
      return {
        x: (mouseX - offset.x) / scale,
        y: (mouseY - offset.y) / scale,
      };
    };

    const getMousePosInDrawArea = () =>
      transformMouseToDrawArea(p.mouseX, p.mouseY);

    const getPreviewYOffset = () => {
      return currentProps.isPreview && !isAnimatingBlink
        ? p.sin(p.frameCount * 0.05) * 1.5
        : 0;
    };

    const getLeftEyeCenterX = () =>
      getDrawAreaCenter().x - currentProps.eyeSpacing / 2;

    const getMouseInEyeSpace = () => {
      const drawMouse = getMousePosInDrawArea();
      const leftEyeCenterX = getLeftEyeCenterX();
      const yOffset = getPreviewYOffset();
      return {
        x: drawMouse.x - leftEyeCenterX,
        y: drawMouse.y - yOffset,
      };
    };

    const getPupilTargetPos = () => {
      if (
        currentProps.isCircleActive &&
        currentProps.circlePosition &&
        currentProps.canvasPosition
      ) {
        return transformMouseToDrawArea(
          currentProps.circlePosition.x - currentProps.canvasPosition.x,
          currentProps.circlePosition.y - currentProps.canvasPosition.y
        );
      }
      return getMousePosInDrawArea();
    };

    const checkNoseHit = (mousePos: {x: number; y: number}) => {
      const {noseSettings} = currentProps;
      const noseW = 67.29 * noseSettings.scale + 40;
      const noseH = 44.59 * noseSettings.scale + 40;
      const center = getDrawAreaCenter();

      return (
        Math.abs(mousePos.x - center.x) < noseW / 2 &&
        Math.abs(mousePos.y - noseSettings.y) < noseH / 2
      );
    };

    const tryTriggerBlink = () => {
      if (
        !currentProps.isCircleActive &&
        currentProps.animationStatus !== "blinking"
      ) {
        currentProps.setAnimationStatus("blinking");
      }
    };

    // --- Logic Functions ---

    const startBlink = (initialState: EyeState) => {
      isAnimatingBlink = true;
      blinkProgress = 0;
      blinkDirection = 1;
      blinkCloseTime = null;
      blinkStartState = deepClone(initialState);
    };

    const updateAndGetBlinkState = (baseState: EyeState): EyeState => {
      if (!isAnimatingBlink || !blinkStartState) return baseState;

      if (blinkDirection === 1) {
        // Closing
        blinkProgress += BLINK_CLOSE_SPEED;
        if (blinkProgress >= 1) {
          blinkProgress = 1;
          blinkDirection = 0;
          blinkCloseTime = p.millis();
        }
      } else if (blinkDirection === 0 && blinkCloseTime !== null) {
        // Stay
        if (p.millis() - blinkCloseTime >= BLINK_STAY_DURATION) {
          blinkDirection = -1;
          blinkCloseTime = null;
        }
      } else if (blinkDirection === -1) {
        // Opening
        blinkProgress -= BLINK_OPEN_SPEED;
        if (blinkProgress <= 0) {
          blinkProgress = 0;
          isAnimatingBlink = false;
          blinkStartState = null;
          currentProps.onBlinkFinish();
          return baseState;
        }
      }

      const easedProgress = (1 - p.cos(blinkProgress * p.PI)) / 2;
      const t = currentProps.blinkRatio;
      const animatedState = deepClone(blinkStartState);

      const lerpAngle = (s: number, e: number, amt: number) => {
        let diff = e - s;
        while (diff > p.PI) diff -= p.TWO_PI;
        while (diff < -p.PI) diff += p.TWO_PI;
        return s + diff * amt;
      };

      const toCartesian = (
        origin: {x: number; y: number},
        r: number,
        angle: number
      ) => ({
        x: origin.x + p.cos(angle) * r,
        y: origin.y + p.sin(angle) * r,
      });

      const calculateTargetCP = (
        cpStart: {x: number; y: number},
        corner: {x: number; y: number},
        cpEnd: {x: number; y: number}
      ) => {
        const vStart = p.createVector(
          cpStart.x - corner.x,
          cpStart.y - corner.y
        );
        const vEnd = p.createVector(cpEnd.x - corner.x, cpEnd.y - corner.y);
        const r = p.lerp(vEnd.mag(), vStart.mag(), t);
        const a = lerpAngle(vEnd.heading(), vStart.heading(), t);
        return toCartesian(corner, r, a);
      };

      const targetCp1 = calculateTargetCP(
        blinkStartState.upperEyelid.cp1,
        blinkStartState.innerCorner,
        blinkStartState.lowerEyelid.cp1
      );
      const targetCp2 = calculateTargetCP(
        blinkStartState.upperEyelid.cp2,
        blinkStartState.outerCorner,
        blinkStartState.lowerEyelid.cp2
      );

      const interpolatePoint = (
        curr: {x: number; y: number},
        target: {x: number; y: number}
      ) => ({
        x: p.lerp(curr.x, target.x, easedProgress),
        y: p.lerp(curr.y, target.y, easedProgress),
      });

      animatedState.upperEyelid.cp1 = interpolatePoint(
        blinkStartState.upperEyelid.cp1,
        targetCp1
      );
      animatedState.lowerEyelid.cp1 = interpolatePoint(
        blinkStartState.lowerEyelid.cp1,
        targetCp1
      );
      animatedState.upperEyelid.cp2 = interpolatePoint(
        blinkStartState.upperEyelid.cp2,
        targetCp2
      );
      animatedState.lowerEyelid.cp2 = interpolatePoint(
        blinkStartState.lowerEyelid.cp2,
        targetCp2
      );

      return animatedState;
    };

    const updateAndGetPupilOffsets = () => {
      const center = getDrawAreaCenter();
      const yOff = getPreviewYOffset();
      return updatePupilOffsets(pupilState, {
        targetPos: getPupilTargetPos(),
        leftEyeCenterX: center.x - currentProps.eyeSpacing / 2,
        rightEyeCenterX: center.x + currentProps.eyeSpacing / 2,
        irisX: currentProps.eyeState.iris.x,
        irisY: yOff + currentProps.eyeState.iris.y,
        eyeSpacing: currentProps.eyeSpacing,
        eyeballRadius: currentProps.eyeballRadius,
        l_irisConstraint: currentProps.l_irisConstraint,
        irisWidth: currentProps.eyeState.iris.w,
        isPupilTracking: currentProps.isPupilTracking,
        currentTimeMs: p.millis(),
        lerpFn: p.lerp,
      });
    };

    const updateControlsVisibility = () => {
      if (currentProps.activeMode !== "eye") {
        controlsOpacity = 0;
        return;
      }

      const currentMousePos = {x: p.mouseX, y: p.mouseY};
      if (!isMouseInitialized || lastMousePosition.x < 0) {
        lastMousePosition = currentMousePos;
        lastMouseMoveTime = p.millis();
        isMouseInitialized = true;
      }

      const mouseInEye = getMouseInEyeSpace();
      const eyeState = currentProps.eyeState;
      const detectionRadius =
        currentProps.eyeballRadius * EYE_DETECTION_RADIUS_RATIO;

      const distanceToEye = p.dist(
        mouseInEye.x,
        mouseInEye.y,
        eyeState.iris.x,
        eyeState.iris.y
      );
      const wasNearEye = isCursorNearEye;
      isCursorNearEye = distanceToEye <= detectionRadius;

      const mouseMoved =
        p.dist(
          currentMousePos.x,
          currentMousePos.y,
          lastMousePosition.x,
          lastMousePosition.y
        ) > MOUSE_MOVE_THRESHOLD;

      if (mouseMoved) {
        lastMousePosition = currentMousePos;
        lastMouseMoveTime = p.millis();
      }

      const timeSinceLastMove = p.millis() - lastMouseMoveTime;

      let shouldShow =
        isCursorNearEye &&
        (mouseMoved ||
          wasNearEye ||
          timeSinceLastMove < CURSOR_STATIONARY_THRESHOLD);

      controlsOpacity = shouldShow
        ? Math.min(1.0, controlsOpacity + FADE_SPEED)
        : Math.max(0.0, controlsOpacity - FADE_SPEED);

      const mousePos = getMousePosInDrawArea();
      const noseCenterX = getDrawAreaCenter().x;
      const distanceToNose = p.dist(
        mousePos.x,
        mousePos.y,
        noseCenterX,
        currentProps.noseSettings.y
      );
      const wasNearNose = isCursorNearNose;
      isCursorNearNose = distanceToNose <= NOSE_DETECTION_RADIUS;

      let shouldShowNose =
        isCursorNearNose &&
        (mouseMoved ||
          wasNearNose ||
          timeSinceLastMove < CURSOR_STATIONARY_THRESHOLD);

      noseControlsOpacity = shouldShowNose
        ? Math.min(1.0, noseControlsOpacity + FADE_SPEED)
        : Math.max(0.0, noseControlsOpacity - FADE_SPEED);
    };

    // --- Drawing Functions ---

    const drawSingleEye = (
      eyeState: EyeState,
      offsetX: number,
      offsetY: number,
      pupilOffset: {x: number; y: number},
      isLeft: boolean
    ) => {
      drawSingleEyePreview(
        p,
        eyeState,
        pupilOffset,
        offsetX,
        offsetY,
        isLeft,
        currentProps.eyeballColor,
        currentProps.eyeballRadius,
        currentProps.pupilWidthRatio
      );

      if (isLeft && controlsOpacity > 0) {
        // Reconstruct renderState for controls (with pupil offset applied)
        const renderState = deepClone(eyeState);
        renderState.iris.x += pupilOffset.x;
        renderState.iris.y += pupilOffset.y;
        renderState.pupil.x += pupilOffset.x;
        renderState.pupil.y += pupilOffset.y;

        const mouseInEye = getMouseInEyeSpace();
        p.push();
        p.translate(offsetX, offsetY);
        const ctx: EyeDrawingContext = {
          p,
          eyeState: currentProps.eyeState,
          handleModes: currentProps.handleModes,
          eyeballColor: currentProps.eyeballColor,
          eyeballRadius: currentProps.eyeballRadius,
          k_anchorConstraint: currentProps.k_anchorConstraint,
          pupilWidthRatio: currentProps.pupilWidthRatio,
          isPreview: currentProps.isPreview,
          drawSize: getReferenceDrawSize(),
          eyeSpacing: currentProps.eyeSpacing,
          canvasSize: currentProps.canvasSize,
          controlsOpacity,
        };
        drawEyeControls(ctx, renderState, mouseInEye.x, mouseInEye.y);
        p.pop();
      }
    };

    const drawControlCross = (
      centerX: number,
      centerY: number,
      opacity: number,
      size: number,
      verticalOnly: boolean = false
    ) => {
      if (opacity <= 0) return;

      p.push();
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.globalAlpha = opacity;

      p.stroke(100, 150, 255);
      p.strokeWeight(2);
      p.noFill();

      const hSize = verticalOnly ? size / 2 : size;
      p.line(centerX - hSize, centerY, centerX + hSize, centerY);
      p.line(centerX, centerY - size, centerX, centerY + size);

      p.fill(100, 150, 255);
      p.noStroke();
      p.circle(centerX, centerY, 4);
      p.pop();
    };

    // Main Draw Loop
    p.draw = () => {
      p.clear();

      const currentEyeState = updateAndGetBlinkState(currentProps.eyeState);
      const pupilOffsets = updateAndGetPupilOffsets();

      updateControlsVisibility();

      const furDrawing = createFurDrawing(
        {
          p,
          textureSettings: currentProps.textureSettings,
          drawSize: getReferenceDrawSize(),
          activeMode: currentProps.activeMode,
          initialFurColor: INIT_FUR_COLOR,
        },
        furDrawingState
      );

      const offset = getCanvasOffset();
      const scaleFactor = getScaleFactor();
      p.push();
      p.translate(offset.x, offset.y);
      p.scale(scaleFactor, scaleFactor);

      // --- Optimized Fur Drawing ---
      // needsRedrawフラグが立っている時のみ重い描画を行い、
      // それ以外はキャッシュされた画像を貼り付ける
      furDrawing.renderStaticFur();

      // グリッド密度などが変わった場合のチェック
      furDrawing.ensureGridSize(currentProps.textureSettings.density);

      // 色の置き換えリクエストを処理
      if (
        currentProps.colorReplaceRequest &&
        currentProps.activeMode === "texture"
      ) {
        const {oldColor, newColor} = currentProps.colorReplaceRequest;
        // 同じリクエストを重複処理しないようにチェック
        if (
          !lastProcessedColorReplace ||
          lastProcessedColorReplace.oldColor !== oldColor ||
          lastProcessedColorReplace.newColor !== newColor
        ) {
          furDrawing.replaceBrushColor(oldColor, newColor);
          lastProcessedColorReplace = {oldColor, newColor};
          needsBrushColorScan = true;
        }
      } else {
        // リクエストがクリアされたら、lastProcessedColorReplaceもリセット
        lastProcessedColorReplace = null;
      }

      // パレット色スキャン（フラグが立っている時のみ実行）
      if (
        needsBrushColorScan &&
        currentProps.activeMode === "texture" &&
        currentProps.onPaletteColorsUpdate
      ) {
        currentProps.onPaletteColorsUpdate(furDrawing.getUsedBrushColors());
        needsBrushColorScan = false;
      }

      // Texture Painting
      const mouseInDraw = getMousePosInDrawArea();
      if (currentProps.activeMode === "texture" && p.mouseIsPressed) {
        if (
          mouseInDraw.x >= 0 &&
          mouseInDraw.x <= REFERENCE_DRAW_WIDTH &&
          mouseInDraw.y >= 0 &&
          mouseInDraw.y <= REFERENCE_DRAW_HEIGHT
        ) {
          furDrawing.paintAt(
            mouseInDraw.x,
            mouseInDraw.y,
            currentProps.textureSettings.brushRadius,
            currentProps.textureSettings.brushColor,
            currentProps.textureSettings.density
          );
        }
      }

      // Eyes
      const center = getDrawAreaCenter();
      const yOffset = getPreviewYOffset();
      const leftEyeX = center.x - currentProps.eyeSpacing / 2;
      const rightEyeX = center.x + currentProps.eyeSpacing / 2;

      drawSingleEye(
        currentEyeState,
        leftEyeX,
        yOffset,
        pupilOffsets.left,
        true
      );
      drawSingleEye(
        currentEyeState,
        rightEyeX,
        yOffset,
        pupilOffsets.right,
        false
      );

      const isControlActive =
        currentProps.activeMode === "eye" && !isAnimatingBlink;

      // Eye Spacing Control
      if (isControlActive) {
        const eyeCenterY = yOffset + currentEyeState.iris.y;
        drawControlCross(
          leftEyeX,
          eyeCenterY,
          controlsOpacity,
          EYE_SPACING_CONTROL_SIZE
        );

        // Pupil Width Slider (below left eye)
        if (controlsOpacity > 0) {
          const sliderY = eyeCenterY + currentProps.eyeballRadius + 20;
          const sliderLeft = leftEyeX - PUPIL_SLIDER_WIDTH / 2;
          const knobX =
            sliderLeft +
            ((currentProps.pupilWidthRatio - 0.1) / 0.9) * PUPIL_SLIDER_WIDTH;

          p.push();
          const sliderCtx = p.drawingContext as CanvasRenderingContext2D;
          sliderCtx.globalAlpha = controlsOpacity;

          // Track
          p.stroke(100, 150, 255);
          p.strokeWeight(PUPIL_SLIDER_HEIGHT);
          p.strokeCap(p.ROUND);
          p.line(sliderLeft, sliderY, sliderLeft + PUPIL_SLIDER_WIDTH, sliderY);

          // Knob
          p.fill(255);
          p.stroke(100, 150, 255);
          p.strokeWeight(2);
          p.circle(knobX, sliderY, PUPIL_SLIDER_KNOB_RADIUS * 2);

          p.pop();
        }
      }

      // Nose
      drawNose(p, currentProps.noseSettings, getReferenceDrawSize());

      // Nose Control
      if (isControlActive) {
        drawControlCross(
          center.x,
          currentProps.noseSettings.y,
          noseControlsOpacity,
          NOSE_CONTROL_SIZE,
          true
        );

        // Nose scale circle (dashed)
        if (noseControlsOpacity > 0) {
          p.push();
          const noseCtx = p.drawingContext as CanvasRenderingContext2D;
          noseCtx.globalAlpha = noseControlsOpacity;
          p.noFill();
          p.strokeWeight(1.5);
          noseCtx.setLineDash([4, 4]);
          p.stroke(220, 200, 255);
          const noseCircleRadius = NOSE_BASE_RADIUS * currentProps.noseSettings.scale;
          p.circle(center.x, currentProps.noseSettings.y, noseCircleRadius * 2);
          noseCtx.setLineDash([]);
          p.pop();
        }
      }


      p.pop();

      // Cursor (Translate has been popped, so apply offset manually or wrap in push/pop with translation)
      // カーソルは描画エリア基準で計算されているため、キャンバスオフセットとスケールを適用
      p.push();
      p.translate(offset.x, offset.y);
      p.scale(scaleFactor, scaleFactor);
      furDrawing.drawTextureBrushCursor(mouseInDraw);
      p.pop();
    };

    // --- Event Handlers ---

    const calculateConstrainedPos = (
      pivot: {x: number; y: number},
      handle: {x: number; y: number},
      opposite: {x: number; y: number}
    ) => {
      const dist = p.dist(opposite.x, opposite.y, pivot.x, pivot.y);
      const vec = p.createVector(handle.x - pivot.x, handle.y - pivot.y);
      if (vec.mag() === 0) return opposite;
      vec.normalize().mult(-dist);
      return {x: pivot.x + vec.x, y: pivot.y + vec.y};
    };

    // Clamp heading to contiguous range [-maxAbs, +maxAbs] centered on 0
    const clampAngleCentered = (heading: number, maxAbs: number): number => {
      if (heading > maxAbs) return maxAbs;
      if (heading < -maxAbs) return -maxAbs;
      return heading;
    };

    // Clamp heading to wrapping range, excluding (-minAbs, +minAbs) around 0
    const clampAngleWrapping = (heading: number, minAbs: number): number => {
      if (heading > -minAbs && heading < minAbs) {
        return heading >= 0 ? minAbs : -minAbs;
      }
      return heading;
    };

    // Clamp a position's angle relative to a pivot point
    const clampHandlePos = (
      pivot: {x: number; y: number},
      pos: {x: number; y: number},
      clampFn: (heading: number) => number
    ): {x: number; y: number} => {
      const vec = p.createVector(pos.x - pivot.x, pos.y - pivot.y);
      const mag = vec.mag();
      if (mag === 0) return pos;
      const heading = clampFn(vec.heading());
      return {
        x: pivot.x + Math.cos(heading) * mag,
        y: pivot.y + Math.sin(heading) * mag,
      };
    };

    p.mousePressed = () => {
      const mousePos = getMousePosInDrawArea();

      if (currentProps.activeMode !== "eye" || isAnimatingBlink) {
        if (checkNoseHit(mousePos)) tryTriggerBlink();
        return;
      }

      const center = getDrawAreaCenter();

      // 1. Nose Click (Color Picker)
      // --- 修正箇所: カラーピッカーの表示位置とクリック動作の改善 ---
      if (checkNoseHit(mousePos)) {
        const distToNoseControl = p.dist(
          mousePos.x,
          mousePos.y,
          center.x,
          currentProps.noseSettings.y
        );
        const noseScaleCircleRadius = NOSE_BASE_RADIUS * currentProps.noseSettings.scale;
        const isOnNoseScaleCircle = Math.abs(distToNoseControl - noseScaleCircleRadius) < POINT_RADIUS * 1.5;

        // コントロールポイントのドラッグでもスケール円のドラッグでもない場合（鼻自体をクリックした場合）
        if (distToNoseControl >= NOSE_CONTROL_RADIUS && !isOnNoseScaleCircle) {
            // まだピッカーがない場合は作成
            if (!noseColorPicker) {
                noseColorPicker = p.createColorPicker(currentProps.noseSettings.color);
                const inputElement = noseColorPicker.elt as HTMLInputElement;
                // 初期スタイル: 固定位置、非表示だがクリック可能にするためopacityで制御
                inputElement.style.position = "fixed";
                inputElement.style.zIndex = "9999";
                inputElement.style.opacity = "0";
                inputElement.style.pointerEvents = "auto"; // クリックを受け付けるように
                inputElement.style.width = "1px";
                inputElement.style.height = "1px";
            }

            const inputElement = noseColorPicker.elt as HTMLInputElement;

            // 画面上での正確な位置を計算 (CanvasのClientRect + 内部オフセット)
            // p5.jsのcanvas要素にアクセス（TypeScriptの型定義に含まれていないため、anyでキャスト）
            const canvasElement = (p as any).canvas as HTMLCanvasElement;
            const canvasRect = canvasElement.getBoundingClientRect();
            const canvasOffset = getCanvasOffset();
            
            // 鼻のCanvas内絶対位置（参照座標系からスケール変換）
            const scale = getScaleFactor();
            const noseCanvasX = canvasOffset.x + center.x * scale;
            const noseCanvasY = canvasOffset.y + currentProps.noseSettings.y * scale;

            // 画面全体での絶対位置
            const screenX = canvasRect.left + noseCanvasX;
            const screenY = canvasRect.top + noseCanvasY;

            // ピッカーを鼻の位置に移動（これにより、ブラウザのポップアップが鼻の近くに出る）
            inputElement.style.left = `${screenX}px`;
            inputElement.style.top = `${screenY}px`;

            // 値を現在の色に同期
            inputElement.value = currentProps.noseSettings.color;

            // p5の .input() はリスナーを追加し続けるため、ネイティブの oninput を使用して上書きする
            // これにより、クリックのたびにリスナーが増えるのを防ぎつつ、クロージャの最新のpropsを参照できる
            inputElement.oninput = () => {
                const newVal = inputElement.value;
                currentProps.setNoseSettings((prev) => ({...prev, color: newVal}));
            };

            // クリック発火
            inputElement.click();
            return;
        }
      }
      // -----------------------------------------------------------

      // 2. Nose Control
      const distToNoseControl = p.dist(
        mousePos.x,
        mousePos.y,
        center.x,
        currentProps.noseSettings.y
      );

      if (distToNoseControl < NOSE_CONTROL_RADIUS) {
        draggingPoint = "noseControl";
        initialNoseYOnDrag = currentProps.noseSettings.y;
        dragOffset = {x: 0, y: mousePos.y};
        return;
      }

      // Nose scale circle drag
      const noseScaleCircleRadius = NOSE_BASE_RADIUS * currentProps.noseSettings.scale;
      if (Math.abs(distToNoseControl - noseScaleCircleRadius) < POINT_RADIUS * 1.5) {
        draggingPoint = "noseScaleCircle";
        return;
      }

      // 2. Pupil Width Slider
      const yOffset = getPreviewYOffset();
      const eyeCenterY = yOffset + currentProps.eyeState.iris.y;
      const leftEyeCenterX = getLeftEyeCenterX();
      const sliderY = eyeCenterY + currentProps.eyeballRadius + 20;
      const sliderLeft = leftEyeCenterX - PUPIL_SLIDER_WIDTH / 2;
      if (
        mousePos.x >= sliderLeft - PUPIL_SLIDER_KNOB_RADIUS &&
        mousePos.x <= sliderLeft + PUPIL_SLIDER_WIDTH + PUPIL_SLIDER_KNOB_RADIUS &&
        Math.abs(mousePos.y - sliderY) < PUPIL_SLIDER_KNOB_RADIUS + 4
      ) {
        draggingPoint = "pupilWidthSlider";
        return;
      }

      // 3. Eye Spacing Control
      const distToEyeSpacingControl = p.dist(
        mousePos.x,
        mousePos.y,
        leftEyeCenterX,
        eyeCenterY
      );

      if (distToEyeSpacingControl < EYE_SPACING_CONTROL_RADIUS) {
        draggingPoint = "eyeSpacingControl";
        initialEyeSpacingOnDrag = currentProps.eyeSpacing;
        dragOffset = {x: mousePos.x, y: 0};
        return;
      }

      // 3. Eye Points & Constraints
      const m = getMouseInEyeSpace();
      const s = currentProps.eyeState;

      const points: Record<string, {x: number; y: number}> = {
        innerCorner: s.innerCorner,
        outerCorner: s.outerCorner,
        upperCp1: s.upperEyelid.cp1,
        upperCp2: s.upperEyelid.cp2,
        lowerCp1: s.lowerEyelid.cp1,
        lowerCp2: s.lowerEyelid.cp2,
      };

      for (const [k, v] of Object.entries(points)) {
        if (p.dist(m.x, m.y, v.x, v.y) < POINT_RADIUS * 2) {
          draggingPoint = k;
          dragOffset = {x: m.x - v.x, y: m.y - v.y};
          return;
        }
      }

      const distToIris = p.dist(m.x, m.y, s.iris.x, s.iris.y);
      const anchorLimit =
        currentProps.eyeballRadius * currentProps.k_anchorConstraint;

      if (Math.abs(distToIris - anchorLimit) < POINT_RADIUS * 1.5) {
        draggingPoint = "anchorConstraintCircle";
        return;
      }
    };

    p.mouseDragged = () => {
      if (currentProps.activeMode !== "eye" || !draggingPoint) return;

      if (draggingPoint === "noseControl") {
        const mousePos = getMousePosInDrawArea();
        const deltaY = mousePos.y - dragOffset.y;
        const newNoseY = p.constrain(initialNoseYOnDrag + deltaY, 275, 420);
        currentProps.setNoseSettings((prev) => ({...prev, y: newNoseY}));
        return;
      }

      if (draggingPoint === "noseScaleCircle") {
        const mousePos = getMousePosInDrawArea();
        const center = getDrawAreaCenter();
        const r = p.dist(mousePos.x, mousePos.y, center.x, currentProps.noseSettings.y);
        const newScale = p.constrain(r / NOSE_BASE_RADIUS, 0.3, 2.0);
        currentProps.setNoseSettings((prev) => ({...prev, scale: newScale}));
        return;
      }

      if (draggingPoint === "eyeSpacingControl") {
        const mousePos = getMousePosInDrawArea();
        const center = getDrawAreaCenter();
        const initialLeftEyeX = center.x - initialEyeSpacingOnDrag / 2;
        const deltaX = mousePos.x - initialLeftEyeX;
        const newEyeSpacing = p.constrain(
          initialEyeSpacingOnDrag - deltaX * 2,
          350,
          600
        );
        currentProps.setEyeSpacing(newEyeSpacing);
        return;
      }

      if (draggingPoint === "pupilWidthSlider") {
        const mousePos = getMousePosInDrawArea();
        const leftEyeCenterX = getLeftEyeCenterX();
        const sliderLeft = leftEyeCenterX - PUPIL_SLIDER_WIDTH / 2;
        const t = (mousePos.x - sliderLeft) / PUPIL_SLIDER_WIDTH;
        const ratio = p.constrain(t * 0.9 + 0.1, 0.1, 1.0);
        currentProps.setPupilWidthRatio(ratio);
        return;
      }

      const m = getMouseInEyeSpace();

      if (draggingPoint === "anchorConstraintCircle") {
        const r = p.dist(
          m.x,
          m.y,
          currentProps.eyeState.iris.x,
          currentProps.eyeState.iris.y
        );
        const ratio = r / currentProps.eyeballRadius;
        currentProps.setK_anchorConstraint(p.constrain(ratio, 0.1, 1.0));
        return;
      }

      currentProps.setEyeState((prev: EyeState) => {
        const next = deepClone(prev);
        const newPos = {x: m.x - dragOffset.x, y: m.y - dragOffset.y};

        if (
          draggingPoint === "innerCorner" ||
          draggingPoint === "outerCorner"
        ) {
          const center = {x: prev.iris.x, y: prev.iris.y};
          const vec = p.createVector(newPos.x - center.x, newPos.y - center.y);

          // Clamp rotation angle to prevent full rotation
          let heading = vec.heading(); // radians, -PI to PI
          if (draggingPoint === "innerCorner") {
            // 目尻 (away from nose): valid range [120°, 240°] = |heading| >= 2π/3
            heading = clampAngleWrapping(heading, (2 * p.PI) / 3);
          } else {
            // 目頭 (toward nose): valid range [-60°, +60°] = |heading| <= π/3
            heading = clampAngleCentered(heading, p.PI / 3);
          }

          const mag =
            currentProps.eyeballRadius * currentProps.k_anchorConstraint;
          const fixedPos = {
            x: center.x + Math.cos(heading) * mag,
            y: center.y + Math.sin(heading) * mag,
          };

          const isInner = draggingPoint === "innerCorner";
          const prevCorner = isInner ? prev.innerCorner : prev.outerCorner;
          const delta = {
            x: fixedPos.x - prevCorner.x,
            y: fixedPos.y - prevCorner.y,
          };

          if (isInner) {
            next.innerCorner = fixedPos;
            next.upperEyelid.cp1.x += delta.x;
            next.upperEyelid.cp1.y += delta.y;
            next.lowerEyelid.cp1.x += delta.x;
            next.lowerEyelid.cp1.y += delta.y;
          } else {
            next.outerCorner = fixedPos;
            next.upperEyelid.cp2.x += delta.x;
            next.upperEyelid.cp2.y += delta.y;
            next.lowerEyelid.cp2.x += delta.x;
            next.lowerEyelid.cp2.y += delta.y;
          }
        } else {
          switch (draggingPoint) {
            case "upperCp1": {
              // 目尻 upper: [-180°, -60°]
              const clamped = clampHandlePos(
                next.innerCorner, newPos,
                (h) => Math.max(-p.PI, Math.min(-p.PI / 3, h))
              );
              next.upperEyelid.cp1 = clamped;
              if (currentProps.handleModes.inner) {
                const mirrored = calculateConstrainedPos(
                  next.innerCorner, clamped, prev.lowerEyelid.cp1
                );
                next.lowerEyelid.cp1 = clampHandlePos(
                  next.innerCorner, mirrored,
                  (h) => Math.max(0, Math.min((2 * p.PI) / 3, h))
                );
              }
              break;
            }
            case "lowerCp1": {
              // 目尻 lower: [0°, 120°]
              const clamped = clampHandlePos(
                next.innerCorner, newPos,
                (h) => Math.max(0, Math.min((2 * p.PI) / 3, h))
              );
              next.lowerEyelid.cp1 = clamped;
              if (currentProps.handleModes.inner) {
                const mirrored = calculateConstrainedPos(
                  next.innerCorner, clamped, prev.upperEyelid.cp1
                );
                next.upperEyelid.cp1 = clampHandlePos(
                  next.innerCorner, mirrored,
                  (h) => Math.max(-p.PI, Math.min(-p.PI / 3, h))
                );
              }
              break;
            }
            case "upperCp2": {
              // 目頭 upper: [-120°, 0°]
              const clamped = clampHandlePos(
                next.outerCorner, newPos,
                (h) => Math.max(-(2 * p.PI) / 3, Math.min(0, h))
              );
              next.upperEyelid.cp2 = clamped;
              if (currentProps.handleModes.outer) {
                const mirrored = calculateConstrainedPos(
                  next.outerCorner, clamped, prev.lowerEyelid.cp2
                );
                next.lowerEyelid.cp2 = clampHandlePos(
                  next.outerCorner, mirrored,
                  (h) => Math.max(p.PI / 3, Math.min(p.PI, h))
                );
              }
              break;
            }
            case "lowerCp2": {
              // 目頭 lower: [60°, 180°]
              const clamped = clampHandlePos(
                next.outerCorner, newPos,
                (h) => Math.max(p.PI / 3, Math.min(p.PI, h))
              );
              next.lowerEyelid.cp2 = clamped;
              if (currentProps.handleModes.outer) {
                const mirrored = calculateConstrainedPos(
                  next.outerCorner, clamped, prev.upperEyelid.cp2
                );
                next.upperEyelid.cp2 = clampHandlePos(
                  next.outerCorner, mirrored,
                  (h) => Math.max(-(2 * p.PI) / 3, Math.min(0, h))
                );
              }
              break;
            }
          }
        }
        return next;
      });
    };

    p.mouseReleased = () => {
      draggingPoint = null;

      if (currentProps.activeMode === "texture") {
        needsBrushColorScan = true;
      }
    };

    p.doubleClicked = () => {
      if (currentProps.activeMode !== "eye" || isAnimatingBlink) return;
      const m = getMouseInEyeSpace();
      const s = currentProps.eyeState;
      if (
        p.dist(m.x, m.y, s.innerCorner.x, s.innerCorner.y) <
        POINT_RADIUS * 2
      ) {
        currentProps.setHandleModes((prev) => ({...prev, inner: !prev.inner}));
      } else if (
        p.dist(m.x, m.y, s.outerCorner.x, s.outerCorner.y) <
        POINT_RADIUS * 2
      ) {
        currentProps.setHandleModes((prev) => ({...prev, outer: !prev.outer}));
      }
    };

    p.keyPressed = () => {
      if (
        currentProps.activeMode === "texture" &&
        p.key.toLowerCase() === "r"
      ) {
        currentProps.onResetBrush?.();
        // FurDrawingにリセット命令を送り、強制再描画させる
        const furDrawing = createFurDrawing(
          {
            p,
            textureSettings: currentProps.textureSettings,
            drawSize: getReferenceDrawSize(),
            activeMode: currentProps.activeMode,
            initialFurColor: INIT_FUR_COLOR,
          },
          furDrawingState
        );
        furDrawing.resetBrush();
        needsBrushColorScan = true;
      }
    };
  };
};