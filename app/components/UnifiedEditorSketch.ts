import type p5Type from "p5";
import type {
  EyeState,
  HandleModes,
  TextureSettings,
  NoseSettings,
} from "../types";
import {createFurDrawing, type FurDrawingState} from "./FurDrawing";
import {
  applyClipPath,
  drawEyeContents,
  drawEyeControls,
  drawNose,
  type EyeDrawingContext,
} from "./EyeDrawing";

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
  setL_irisConstraint: (value: number) => void;
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
  circlePosition?: {x: number; y: number} | null;
  isCircleActive?: boolean;
  canvasPosition?: {x: number; y: number} | null;
}

type P5WithProps = p5Type & {
  updateWithProps?: (newProps: Record<string, unknown>) => void;
};

// --- Constants ---
const CANVAS_OFFSET_RATIO = 0.1;
const BLINK_CLOSE_SPEED = 0.07;
const BLINK_OPEN_SPEED = 0.15;
const BLINK_STAY_DURATION = 1000;
const PUPIL_EASING_DURATION = 300;
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
    };

    // Blink State
    let isAnimatingBlink = false;
    let blinkProgress = 0;
    let blinkDirection = 1; // 1: Close, 0: Stay, -1: Open
    let blinkStartState: EyeState | null = null;
    let blinkCloseTime: number | null = null;

    // Pupil Tracking State
    const pupilState = {
      isTracking: false,
      easingStartTime: null as number | null,
      startOffset: {x: 0, y: 0},
      targetOffset: {x: 0, y: 0},
      currentOffset: {x: 0, y: 0},
    };

    // Interaction State
    let draggingPoint: string | null = null;
    let dragOffset = {x: 0, y: 0};
    let initialEyeSpacingOnDrag = 0;
    let initialNoseYOnDrag = 0;

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
      }

      if (typedProps.animationStatus === "blinking" && !isAnimatingBlink) {
        startBlink(typedProps.eyeState);
      }

      currentProps = typedProps;
    };

    // --- Coordinate Helpers ---
    const getCanvasOffset = () => ({
      x: currentProps.canvasSize.width * CANVAS_OFFSET_RATIO,
      y: currentProps.canvasSize.height * CANVAS_OFFSET_RATIO,
    });

    const getDrawAreaCenter = () => ({
      x: currentProps.drawSize.width / 2,
      y: currentProps.drawSize.height / 2,
    });

    const transformMouseToDrawArea = (mouseX: number, mouseY: number) => {
      const offset = getCanvasOffset();
      return {x: mouseX - offset.x, y: mouseY - offset.y};
    };

    // 頻繁に使うため、現在のマウス位置（DrawArea基準）を取得するショートカット
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

    // 瞳孔のターゲット座標（Mouse or Circle）を取得する共通ロジック
    const getPupilTargetPos = () => {
      if (
        currentProps.isCircleActive &&
        currentProps.circlePosition &&
        currentProps.canvasPosition
      ) {
        return {
          x: currentProps.circlePosition.x - currentProps.canvasPosition.x,
          y: currentProps.circlePosition.y - currentProps.canvasPosition.y,
        };
      }
      return getMousePosInDrawArea();
    };

    // 鼻エリアのクリック判定
    const checkNoseHit = (mousePos: {x: number; y: number}) => {
      const {noseSettings, drawSize} = currentProps;
      const noseW = 67.29 * noseSettings.scale + 40;
      const noseH = 44.59 * noseSettings.scale + 40;
      const center = getDrawAreaCenter();

      return (
        Math.abs(mousePos.x - center.x) < noseW / 2 &&
        Math.abs(mousePos.y - noseSettings.y) < noseH / 2
      );
    };

    // 瞬きトリガー処理
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

    const updateAndGetPupilOffset = () => {
      if (currentProps.isPupilTracking !== pupilState.isTracking) {
        pupilState.startOffset = {...pupilState.currentOffset};
        pupilState.easingStartTime = p.millis();
        if (!currentProps.isPupilTracking) {
          pupilState.targetOffset = {x: 0, y: 0};
        }
        pupilState.isTracking = currentProps.isPupilTracking;
      }

      if (currentProps.isPupilTracking) {
        const irisMovableRadius =
          currentProps.eyeballRadius * currentProps.l_irisConstraint;
        const maxOffset = Math.max(
          0,
          irisMovableRadius - currentProps.eyeState.iris.w / 2
        );

        const targetPos = getPupilTargetPos();
        const leftEyeCenterX = getLeftEyeCenterX();
        // マウス座標はDrawArea基準、IrisCenterもDrawArea基準に合わせる
        const irisGlobalX = leftEyeCenterX + currentProps.eyeState.iris.x;
        const irisGlobalY = getPreviewYOffset() + currentProps.eyeState.iris.y;

        const vec = p.createVector(
          targetPos.x - irisGlobalX,
          targetPos.y - irisGlobalY
        );
        vec.limit(maxOffset);
        pupilState.targetOffset = {x: vec.x, y: vec.y};
      }

      if (pupilState.easingStartTime !== null) {
        const elapsed = p.millis() - pupilState.easingStartTime;
        const progress = Math.min(elapsed / PUPIL_EASING_DURATION, 1);
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        pupilState.currentOffset = {
          x: p.lerp(pupilState.startOffset.x, pupilState.targetOffset.x, eased),
          y: p.lerp(pupilState.startOffset.y, pupilState.targetOffset.y, eased),
        };

        if (progress >= 1) pupilState.easingStartTime = null;
      } else if (currentProps.isPupilTracking) {
        pupilState.currentOffset = {...pupilState.targetOffset};
      } else {
        pupilState.currentOffset = {x: 0, y: 0};
      }

      return pupilState.currentOffset;
    };

    const checkCrossEyed = () => {
      if (!currentProps.isPupilTracking && pupilState.easingStartTime === null)
        return false;

      const targetX = getPupilTargetPos().x;
      const center = getDrawAreaCenter();
      const leftEyeX = center.x - currentProps.eyeSpacing / 2;
      const rightEyeX = center.x + currentProps.eyeSpacing / 2;
      return targetX > leftEyeX && targetX < rightEyeX;
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

      // カーソルが目に接近しているかを判定
      const distanceToEye = p.dist(
        mouseInEye.x,
        mouseInEye.y,
        eyeState.iris.x,
        eyeState.iris.y
      );
      const wasNearEye = isCursorNearEye;
      isCursorNearEye = distanceToEye <= detectionRadius;

      // マウスの移動を検出
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

      // コントロール表示の判定 (Eye)
      let shouldShow =
        isCursorNearEye &&
        (mouseMoved ||
          wasNearEye ||
          timeSinceLastMove < CURSOR_STATIONARY_THRESHOLD);

      // フェードイン/アウト (Eye)
      controlsOpacity = shouldShow
        ? Math.min(1.0, controlsOpacity + FADE_SPEED)
        : Math.max(0.0, controlsOpacity - FADE_SPEED);

      // 鼻のコントロール表示判定
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

      // 鼻のコントロールのフェードイン/アウト
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
      isLeft: boolean,
      isCrossEyed: boolean
    ) => {
      p.push();
      p.translate(offsetX, offsetY);
      if (!isLeft) p.scale(-1, 1);

      const renderState = deepClone(eyeState);

      // Pupil Position Update
      renderState.iris.y += pupilOffset.y;
      renderState.pupil.y += pupilOffset.y;

      const pX = pupilOffset.x;
      if (isLeft) {
        renderState.iris.x += pX;
        renderState.pupil.x += pX;
      } else {
        // 右目: scale(-1, 1)されているため、座標系が反転していることを考慮
        const sign = isCrossEyed ? 1 : -1;
        renderState.iris.x += pX * sign;
        renderState.pupil.x += pX * sign;
      }

      applyClipPath(p, renderState);
      p.fill(currentProps.eyeballColor);
      p.noStroke();
      p.circle(
        renderState.iris.x,
        renderState.iris.y,
        currentProps.eyeballRadius * 2
      );
      drawEyeContents(p, renderState, currentProps.pupilWidthRatio);
      p.pop();

      // Controls (Left eye only, editing mode)
      if (isLeft && controlsOpacity > 0) {
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
          l_irisConstraint: currentProps.l_irisConstraint,
          pupilWidthRatio: currentProps.pupilWidthRatio,
          isPreview: currentProps.isPreview,
          drawSize: currentProps.drawSize,
          eyeSpacing: currentProps.eyeSpacing,
          canvasSize: currentProps.canvasSize,
          controlsOpacity,
        };
        drawEyeControls(ctx, renderState, mouseInEye.x, mouseInEye.y);
        p.pop();
      }
    };

    // 十字コントロール描画用共通関数
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

      // 水平線 (verticalOnlyの場合は短く)
      const hSize = verticalOnly ? size / 2 : size;
      p.line(centerX - hSize, centerY, centerX + hSize, centerY);

      // 垂直線
      p.line(centerX, centerY - size, centerX, centerY + size);

      // 中央の円
      p.fill(100, 150, 255);
      p.noStroke();
      p.circle(centerX, centerY, 4);
      p.pop();
    };

    // Main Draw Loop
    p.draw = () => {
      p.clear();

      const currentEyeState = updateAndGetBlinkState(currentProps.eyeState);
      const pupilOffset = updateAndGetPupilOffset();
      const isCrossEyed = checkCrossEyed();

      updateControlsVisibility();

      const furDrawing = createFurDrawing(
        {
          p,
          textureSettings: currentProps.textureSettings,
          drawSize: currentProps.drawSize,
          activeMode: currentProps.activeMode,
        },
        furDrawingState
      );

      const offset = getCanvasOffset();
      p.push();
      p.translate(offset.x, offset.y);

      // Background
      const margin = currentProps.drawSize.width * 0.015;
      p.noStroke();
      p.fill(currentProps.textureSettings.backgroundColor);
      p.rect(
        margin,
        margin,
        currentProps.drawSize.width * 0.97,
        currentProps.drawSize.height * 0.97
      );

      furDrawing.drawEdgeFur();
      furDrawing.ensureGridSize(currentProps.textureSettings.density);

      // Texture Painting
      const mouseInDraw = getMousePosInDrawArea();
      if (currentProps.activeMode === "texture" && p.mouseIsPressed) {
        if (
          mouseInDraw.x >= 0 &&
          mouseInDraw.x <= currentProps.drawSize.width &&
          mouseInDraw.y >= 0 &&
          mouseInDraw.y <= currentProps.drawSize.height
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

      furDrawing.drawFurPattern();

      // Eyes
      const center = getDrawAreaCenter();
      const yOffset = getPreviewYOffset();
      const leftEyeX = center.x - currentProps.eyeSpacing / 2;
      const rightEyeX = center.x + currentProps.eyeSpacing / 2;

      drawSingleEye(
        currentEyeState,
        leftEyeX,
        yOffset,
        pupilOffset,
        true,
        isCrossEyed
      );
      drawSingleEye(
        currentEyeState,
        rightEyeX,
        yOffset,
        pupilOffset,
        false,
        isCrossEyed
      );

      // Controls
      const isControlActive =
        currentProps.activeMode === "eye" && !isAnimatingBlink;

      // Eye Spacing Control (Left Eye Center)
      if (isControlActive) {
        const eyeCenterY = yOffset + currentEyeState.iris.y;
        drawControlCross(
          leftEyeX,
          eyeCenterY,
          controlsOpacity,
          EYE_SPACING_CONTROL_SIZE
        );
      }

      // Nose
      drawNose(p, currentProps.noseSettings, currentProps.drawSize);

      // Nose Control (Center, Vertical bias)
      if (isControlActive) {
        drawControlCross(
          center.x,
          currentProps.noseSettings.y,
          noseControlsOpacity,
          NOSE_CONTROL_SIZE,
          true
        );
      }

      p.pop();

      furDrawing.drawTextureBrushCursor(mouseInDraw);
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

    p.mousePressed = () => {
      const mousePos = getMousePosInDrawArea();

      // Controlが無効、またはアニメーション中の場合、クリックは瞬きトリガーとしてのみ機能
      if (currentProps.activeMode !== "eye" || isAnimatingBlink) {
        if (checkNoseHit(mousePos)) tryTriggerBlink();
        return;
      }

      // --- Controls Check (Priority: Nose Control > Eye Spacing > Points > Nose Blink) ---

      const center = getDrawAreaCenter();

      // 1. Nose Control (Y軸調整)
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

      // 2. Eye Spacing Control
      const yOffset = getPreviewYOffset();
      const eyeCenterY = yOffset + currentProps.eyeState.iris.y;
      const leftEyeCenterX = getLeftEyeCenterX();
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
      const irisLimit =
        currentProps.eyeballRadius * currentProps.l_irisConstraint;
      const anchorLimit =
        currentProps.eyeballRadius * currentProps.k_anchorConstraint;

      if (Math.abs(distToIris - irisLimit) < POINT_RADIUS * 1.5) {
        draggingPoint = "irisConstraintCircle";
        return;
      }
      if (Math.abs(distToIris - anchorLimit) < POINT_RADIUS * 1.5) {
        draggingPoint = "anchorConstraintCircle";
        return;
      }

      // 4. Nose Click (Blink Trigger) - どのコントロールにもヒットしなかった場合
      if (checkNoseHit(mousePos)) {
        tryTriggerBlink();
      }
    };

    p.mouseDragged = () => {
      if (currentProps.activeMode !== "eye" || !draggingPoint) return;

      if (draggingPoint === "noseControl") {
        const mousePos = getMousePosInDrawArea();
        const deltaY = mousePos.y - dragOffset.y;
        const newNoseY = p.constrain(initialNoseYOnDrag + deltaY, 300, 450);
        currentProps.setNoseSettings((prev) => ({...prev, y: newNoseY}));
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

      const m = getMouseInEyeSpace();

      if (
        draggingPoint === "irisConstraintCircle" ||
        draggingPoint === "anchorConstraintCircle"
      ) {
        const r = p.dist(
          m.x,
          m.y,
          currentProps.eyeState.iris.x,
          currentProps.eyeState.iris.y
        );
        const ratio = r / currentProps.eyeballRadius;

        if (draggingPoint === "irisConstraintCircle") {
          currentProps.setL_irisConstraint(
            p.constrain(ratio, currentProps.m_irisScale, 1.0)
          );
        } else {
          currentProps.setK_anchorConstraint(p.constrain(ratio, 0.1, 1.0));
        }
        return;
      }

      currentProps.setEyeState((prev: EyeState) => {
        const next = deepClone(prev);
        const newPos = {x: m.x - dragOffset.x, y: m.y - dragOffset.y};

        if (
          draggingPoint === "innerCorner" ||
          draggingPoint === "outerCorner"
        ) {
          // Move Anchors
          const center = {x: prev.iris.x, y: prev.iris.y};
          const vec = p.createVector(newPos.x - center.x, newPos.y - center.y);
          vec.setMag(
            currentProps.eyeballRadius * currentProps.k_anchorConstraint
          );
          const fixedPos = {x: center.x + vec.x, y: center.y + vec.y};

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
          // Move Control Points
          switch (draggingPoint) {
            case "upperCp1":
              next.upperEyelid.cp1 = newPos;
              if (currentProps.handleModes.inner) {
                next.lowerEyelid.cp1 = calculateConstrainedPos(
                  next.innerCorner,
                  newPos,
                  prev.lowerEyelid.cp1
                );
              }
              break;
            case "lowerCp1":
              next.lowerEyelid.cp1 = newPos;
              if (currentProps.handleModes.inner) {
                next.upperEyelid.cp1 = calculateConstrainedPos(
                  next.innerCorner,
                  newPos,
                  prev.upperEyelid.cp1
                );
              }
              break;
            case "upperCp2":
              next.upperEyelid.cp2 = newPos;
              if (currentProps.handleModes.outer) {
                next.lowerEyelid.cp2 = calculateConstrainedPos(
                  next.outerCorner,
                  newPos,
                  prev.lowerEyelid.cp2
                );
              }
              break;
            case "lowerCp2":
              next.lowerEyelid.cp2 = newPos;
              if (currentProps.handleModes.outer) {
                next.upperEyelid.cp2 = calculateConstrainedPos(
                  next.outerCorner,
                  newPos,
                  prev.upperEyelid.cp2
                );
              }
              break;
          }
        }
        return next;
      });
    };

    p.mouseReleased = () => {
      draggingPoint = null;
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
        furDrawingState.gridUsesBase.forEach((cell) => cell.fill(true));
      }
    };
  };
};
