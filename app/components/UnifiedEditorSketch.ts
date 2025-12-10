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
  pupilWidthRatio: number;
  circlePosition?: {x: number; y: number} | null;
  isCircleActive?: boolean;
  canvasPosition?: {x: number; y: number} | null;
}

// p5インスタンスにupdateWithPropsが存在することを型システムに教える
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

export const createUnifiedEditorSketch = () => {
  return (p: p5Type, props: Record<string, unknown>) => {
    // p5インスタンスを拡張型として扱う
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

    p.setup = () => {
      p.createCanvas(
        currentProps.canvasSize.width,
        currentProps.canvasSize.height
      );
      p.pixelDensity(p.displayDensity());
      p.colorMode(p.RGB);
      p.strokeCap(p.PROJECT);
    };

    // ReactのProps更新を受け取るメソッド
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

    const getPreviewYOffset = () => {
      return currentProps.isPreview && !isAnimatingBlink
        ? p.sin(p.frameCount * 0.05) * 1.5
        : 0;
    };

    const getMouseInEyeSpace = () => {
      const drawMouse = transformMouseToDrawArea(p.mouseX, p.mouseY);
      const center = getDrawAreaCenter();
      const leftEyeCenterX = center.x - currentProps.eyeSpacing / 2;
      const yOffset = getPreviewYOffset();
      return {
        x: drawMouse.x - leftEyeCenterX,
        y: drawMouse.y - yOffset,
      };
    };

    // --- Logic Functions ---

    const startBlink = (initialState: EyeState) => {
      isAnimatingBlink = true;
      blinkProgress = 0;
      blinkDirection = 1;
      blinkCloseTime = null;
      blinkStartState = JSON.parse(JSON.stringify(initialState));
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
      const animatedState = JSON.parse(JSON.stringify(blinkStartState));

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

      // 目標となる閉じた状態の制御点を計算するヘルパー
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

        let targetX: number, targetY: number;
        if (
          currentProps.isCircleActive &&
          currentProps.circlePosition &&
          currentProps.canvasPosition
        ) {
          targetX =
            currentProps.circlePosition.x - currentProps.canvasPosition.x;
          targetY =
            currentProps.circlePosition.y - currentProps.canvasPosition.y;
        } else {
          const mousePos = transformMouseToDrawArea(p.mouseX, p.mouseY);
          targetX = mousePos.x;
          targetY = mousePos.y;
        }

        const center = getDrawAreaCenter();
        const leftEyeCenterX = center.x - currentProps.eyeSpacing / 2;
        // マウス座標はDrawArea基準、IrisCenterもDrawArea基準に合わせる
        const irisGlobalX = leftEyeCenterX + currentProps.eyeState.iris.x;
        const irisGlobalY = getPreviewYOffset() + currentProps.eyeState.iris.y;

        const vec = p.createVector(
          targetX - irisGlobalX,
          targetY - irisGlobalY
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

      let targetX: number;
      if (
        currentProps.isCircleActive &&
        currentProps.circlePosition &&
        currentProps.canvasPosition
      ) {
        targetX = currentProps.circlePosition.x - currentProps.canvasPosition.x;
      } else {
        targetX = transformMouseToDrawArea(p.mouseX, p.mouseY).x;
      }

      const center = getDrawAreaCenter();
      const leftEyeX = center.x - currentProps.eyeSpacing / 2;
      const rightEyeX = center.x + currentProps.eyeSpacing / 2;
      return targetX > leftEyeX && targetX < rightEyeX;
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

      const renderState = JSON.parse(JSON.stringify(eyeState));

      // Pupil Position Update
      renderState.iris.y += pupilOffset.y;
      renderState.pupil.y += pupilOffset.y;

      const pX = pupilOffset.x;
      if (isLeft) {
        renderState.iris.x += pX;
        renderState.pupil.x += pX;
      } else {
        // 右目: scale(-1, 1)されているため、座標系が反転していることを考慮
        if (isCrossEyed) {
          renderState.iris.x += pX;
          renderState.pupil.x += pX;
        } else {
          renderState.iris.x -= pX;
          renderState.pupil.x -= pX;
        }
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
      if (isLeft && !currentProps.isPreview) {
        const mouseInEye = getMouseInEyeSpace(); // ここで計算することで右目描画時の無駄を排除
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
        };
        drawEyeControls(ctx, renderState, mouseInEye.x, mouseInEye.y);
        p.pop();
      }
    };

    // Main Draw Loop
    p.draw = () => {
      p.clear();

      const currentEyeState = updateAndGetBlinkState(currentProps.eyeState);
      const pupilOffset = updateAndGetPupilOffset();
      const isCrossEyed = checkCrossEyed();

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
      const mouseInDraw = transformMouseToDrawArea(p.mouseX, p.mouseY);
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

      drawSingleEye(
        currentEyeState,
        center.x - currentProps.eyeSpacing / 2,
        yOffset,
        pupilOffset,
        true,
        isCrossEyed
      );
      drawSingleEye(
        currentEyeState,
        center.x + currentProps.eyeSpacing / 2,
        yOffset,
        pupilOffset,
        false,
        isCrossEyed
      );

      // Nose
      drawNose(p, currentProps.noseSettings, currentProps.drawSize);

      p.pop();

      furDrawing.drawTextureBrushCursor(mouseInDraw);
    };

    // --- Event Handlers ---

    // 対角線上の制御点を計算するヘルパー
    const calculateConstrainedPos = (
      pivot: {x: number; y: number},
      handle: {x: number; y: number},
      opposite: {x: number; y: number}
    ) => {
      const dist = p.dist(opposite.x, opposite.y, pivot.x, pivot.y);
      const vec = p.createVector(handle.x - pivot.x, handle.y - pivot.y);
      if (vec.mag() === 0) return opposite;
      vec.normalize().mult(-dist); // 反対方向へ
      return {x: pivot.x + vec.x, y: pivot.y + vec.y};
    };

    p.mousePressed = () => {
      // Nose Click (Blink Trigger)
      const mousePos = transformMouseToDrawArea(p.mouseX, p.mouseY);
      const noseY = currentProps.noseSettings.y;
      const noseW = 67.29 * currentProps.noseSettings.scale + 40;
      const noseH = 44.59 * currentProps.noseSettings.scale + 40;
      const center = getDrawAreaCenter();

      if (
        Math.abs(mousePos.x - center.x) < noseW / 2 &&
        Math.abs(mousePos.y - noseY) < noseH / 2
      ) {
        if (
          !currentProps.isCircleActive &&
          currentProps.animationStatus !== "blinking"
        ) {
          currentProps.setAnimationStatus("blinking");
        }
        return;
      }

      if (currentProps.activeMode !== "eye" || isAnimatingBlink) return;

      const m = getMouseInEyeSpace();
      const s = currentProps.eyeState;

      // Control Points Check
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

      // Constraint Circles Check
      const distToIris = p.dist(m.x, m.y, s.iris.x, s.iris.y);
      const irisLimit =
        currentProps.eyeballRadius * currentProps.l_irisConstraint;
      const anchorLimit =
        currentProps.eyeballRadius * currentProps.k_anchorConstraint;

      if (Math.abs(distToIris - irisLimit) < POINT_RADIUS * 1.5)
        draggingPoint = "irisConstraintCircle";
      else if (Math.abs(distToIris - anchorLimit) < POINT_RADIUS * 1.5)
        draggingPoint = "anchorConstraintCircle";
    };

    p.mouseDragged = () => {
      if (currentProps.activeMode !== "eye" || !draggingPoint) return;

      const m = getMouseInEyeSpace();

      // Sliders
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
        const next = JSON.parse(JSON.stringify(prev));
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

          const delta = {
            x:
              fixedPos.x -
              (draggingPoint === "innerCorner"
                ? prev.innerCorner.x
                : prev.outerCorner.x),
            y:
              fixedPos.y -
              (draggingPoint === "innerCorner"
                ? prev.innerCorner.y
                : prev.outerCorner.y),
          };

          if (draggingPoint === "innerCorner") {
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
