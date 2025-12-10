import type p5Type from "p5";
import type {
  EyeState,
  HandleModes,
  TextureSettings,
  NoseSettings,
} from "../types";

interface UnifiedEditorProps {
  // Eye editor props
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

  // Texture editor props
  textureSettings: TextureSettings;
  onResetBrush?: () => void;

  // Shared props
  canvasSize: {width: number; height: number};
  drawSize: {width: number; height: number};
  activeMode: "eye" | "texture";
  noseSettings: NoseSettings;
  pupilWidthRatio: number;
  circlePosition?: {x: number; y: number} | null;
  isCircleActive?: boolean;
  canvasPosition?: {x: number; y: number} | null;
}

export const createUnifiedEditorSketch = () => {
  return (p: p5Type, props: Record<string, unknown>) => {
    let currentProps = props as unknown as UnifiedEditorProps;

    // Texture editor state
    let gridUsesBase: boolean[][] = [];
    let gridCustom: string[][] = [];
    let lastNumLines = -1;

    // Eye editor state
    let draggingPoint: string | null = null;
    let dragOffset = {x: 0, y: 0};
    const pointRadius = 8;
    let isAnimatingBlink = false;
    let blinkProgress = 0;
    let blinkDirection = 1;
    let blinkStartState: EyeState | null = null;
    let blinkCloseTime: number | null = null; // 閉じた状態になった時刻

    // Pupil tracking easing state
    let previousPupilTracking = false;
    let pupilEasingStartTime: number | null = null;
    let pupilEasingStartOffset = {x: 0, y: 0};
    let pupilEasingTargetOffset = {x: 0, y: 0};
    let currentPupilOffset = {x: 0, y: 0};

    p.setup = () => {
      p.createCanvas(
        currentProps.canvasSize.width,
        currentProps.canvasSize.height
      );
      p.pixelDensity(p.displayDensity());
      p.colorMode(p.RGB);
      p.strokeCap(p.PROJECT);
    };

    (
      p as p5Type & {
        updateWithProps?: (newProps: Record<string, unknown>) => void;
      }
    ).updateWithProps = (newProps: Record<string, unknown>) => {
      const typedProps = newProps as unknown as UnifiedEditorProps;
      if (
        currentProps.canvasSize &&
        (currentProps.canvasSize.width !== typedProps.canvasSize.width ||
          currentProps.canvasSize.height !== typedProps.canvasSize.height)
      ) {
        p.resizeCanvas(
          typedProps.canvasSize.width,
          typedProps.canvasSize.height
        );
      }
      if (typedProps.animationStatus === "blinking" && !isAnimatingBlink) {
        isAnimatingBlink = true;
        blinkProgress = 0;
        blinkDirection = 1;
        blinkCloseTime = null;
        blinkStartState = JSON.parse(JSON.stringify(typedProps.eyeState));
      }
      currentProps = typedProps;
    };

    // Helper function to get offset (10% of canvas size)
    const getOffset = () => {
      return {
        x: currentProps.canvasSize.width * 0.1,
        y: currentProps.canvasSize.height * 0.1,
      };
    };

    // Helper function to transform mouse coordinates from canvas to draw area
    const transformMouseToDrawArea = (mouseX: number, mouseY: number) => {
      const offset = getOffset();
      return {
        x: mouseX - offset.x,
        y: mouseY - offset.y,
      };
    };

    // ===== TEXTURE DRAWING FUNCTIONS =====

    const calculateGridDimensions = (density: number) => {
      const drawHeight = currentProps.drawSize.height;
      const drawWidth = currentProps.drawSize.width;
      const gridSpacing = (drawHeight - 1) / (density - 1);
      const numCols = Math.floor((drawWidth - 1) / gridSpacing) + 1;
      return {rows: density, cols: numCols, spacing: gridSpacing};
    };

    const ensureGridSize = (numLines: number) => {
      if (numLines === lastNumLines && gridUsesBase.length) return;

      const {rows, cols} = calculateGridDimensions(numLines);

      gridUsesBase = Array.from({length: cols}, () =>
        Array.from({length: rows}, () => true)
      );

      gridCustom = Array.from({length: cols}, () =>
        Array.from(
          {length: rows},
          () => currentProps.textureSettings.brushColor
        )
      );

      lastNumLines = numLines;
    };

    const paintAt = (
      x: number,
      y: number,
      r: number,
      penColor: string,
      numLines: number
    ) => {
      const {rows, cols, spacing} = calculateGridDimensions(numLines);

      const iMin = p.constrain(p.floor((x - r) / spacing), 0, cols - 1);
      const iMax = p.constrain(p.floor((x + r) / spacing), 0, cols - 1);
      const jMin = p.constrain(p.floor((y - r) / spacing), 0, rows - 1);
      const jMax = p.constrain(p.floor((y + r) / spacing), 0, rows - 1);

      for (let i = iMin; i <= iMax; i++) {
        const xi = spacing * i;
        for (let j = jMin; j <= jMax; j++) {
          const yj = spacing * j;
          const dx = xi - x;
          const dy = yj - y;
          if (dx * dx + dy * dy <= r * r) {
            gridUsesBase[i][j] = false;
            gridCustom[i][j] = penColor;
          }
        }
      }
    };

    const drawFurPattern = () => {
      const {rows, cols, spacing} = calculateGridDimensions(
        currentProps.textureSettings.density
      );

      p.strokeWeight(currentProps.textureSettings.weight);
      p.push();
      p.blendMode(p.BLEND);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const posX = spacing * i;
          const posY = spacing * j;

          const col = gridUsesBase[i][j]
            ? currentProps.textureSettings.baseColor
            : gridCustom[i][j];
          p.stroke(col);

          p.push();
          p.translate(posX, posY);
          p.rotate(
            p.PI *
              p.noise(
                posX / currentProps.textureSettings.angleScale,
                posY / currentProps.textureSettings.angleScale
              )
          );
          p.line(
            -currentProps.textureSettings.lineLength / 2,
            0,
            currentProps.textureSettings.lineLength / 2,
            0
          );
          p.pop();
        }
      }
      p.pop();
    };

    const drawEdgeFur = () => {
      // Edge fur parameters
      const edgeDensity = 60;
      const edgeLineLength = 50;
      const edgeAngleScale = 65;
      const edgeWeight = 8;

      const drawWidth = currentProps.drawSize.width;
      const drawHeight = currentProps.drawSize.height;
      const margin = drawWidth * 0.05; // 5% margin on each side

      // Calculate grid dimensions for edge area
      const gridSpacing = (drawHeight - 1) / (edgeDensity - 1);
      const numCols = Math.floor((drawWidth - 1) / gridSpacing) + 1;
      const numRows = Math.floor((drawHeight - 1) / gridSpacing) + 1;

      p.strokeWeight(edgeWeight);
      p.push();
      p.blendMode(p.BLEND);
      p.stroke(currentProps.textureSettings.backgroundColor);

      for (let i = 0; i < numCols; i++) {
        for (let j = 0; j < numRows; j++) {
          const posX = gridSpacing * i;
          const posY = gridSpacing * j;

          // Check if this position is in the margin area (edge)
          const isInMargin =
            posX < margin ||
            posX > drawWidth - margin ||
            posY < margin ||
            posY > drawHeight - margin;

          if (isInMargin) {
            p.push();
            p.translate(posX, posY);
            p.rotate(
              p.PI * p.noise(posX / edgeAngleScale, posY / edgeAngleScale)
            );
            p.line(-edgeLineLength / 2, 0, edgeLineLength / 2, 0);
            p.pop();
          }
        }
      }
      p.pop();
    };

    const drawTextureBrushCursor = () => {
      if (currentProps.activeMode !== "texture") return;
      const offset = getOffset();
      const transformedMouse = transformMouseToDrawArea(p.mouseX, p.mouseY);
      const mouseInDrawArea =
        transformedMouse.x >= 0 &&
        transformedMouse.x < currentProps.drawSize.width &&
        transformedMouse.y >= 0 &&
        transformedMouse.y < currentProps.drawSize.height;

      if (mouseInDrawArea) {
        p.push();
        p.noFill();
        p.stroke(currentProps.textureSettings.brushColor);
        p.strokeWeight(1);
        p.circle(
          transformedMouse.x + offset.x,
          transformedMouse.y + offset.y,
          currentProps.textureSettings.brushRadius * 2
        );
        p.pop();
      }
    };

    const drawNose = () => {
      const centerX = currentProps.drawSize.width / 2;
      const noseY = currentProps.noseSettings.y;
      const scale = currentProps.noseSettings.scale;

      p.push();
      p.translate(centerX, noseY);
      p.scale(scale);

      // SVG viewBox: 0 0 67.29 44.59
      // Center the nose horizontally
      p.translate(-67.29 / 2, -44.59 / 2);

      // Draw the nose path from nose.svg
      p.fill(currentProps.noseSettings.color);
      p.noStroke();

      p.beginShape();
      // Path: M67.29,20.39c0,8.48-8.54,15.75-20.7,18.83-2.96,3.26-7.7,5.37-13.05,5.37s-10.16-2.15-13.11-5.45C8.42,36.03,0,28.81,0,20.39,0,9.13,15.07,0,33.65,0s33.64,9.13,33.64,20.39Z
      // Simplified: we'll use p5.js drawing commands
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.beginPath();
      ctx.moveTo(67.29, 20.39);
      ctx.bezierCurveTo(67.29, 28.87, 58.75, 36.14, 46.59, 39.22);
      ctx.bezierCurveTo(43.63, 42.48, 38.89, 44.59, 33.54, 44.59);
      ctx.bezierCurveTo(28.19, 44.59, 23.38, 42.44, 20.43, 39.14);
      ctx.bezierCurveTo(8.42, 36.03, 0, 28.81, 0, 20.39);
      ctx.bezierCurveTo(0, 9.13, 15.07, 0, 33.65, 0);
      ctx.bezierCurveTo(52.23, 0, 67.29, 9.13, 67.29, 20.39);
      ctx.closePath();
      ctx.fill();

      p.pop();
    };

    // ===== EYE DRAWING FUNCTIONS =====

    const applyClipPath = (eyeData: EyeState) => {
      const clipPath = new Path2D();
      clipPath.moveTo(eyeData.innerCorner.x, eyeData.innerCorner.y);
      clipPath.bezierCurveTo(
        eyeData.upperEyelid.cp1.x,
        eyeData.upperEyelid.cp1.y,
        eyeData.upperEyelid.cp2.x,
        eyeData.upperEyelid.cp2.y,
        eyeData.outerCorner.x,
        eyeData.outerCorner.y
      );
      clipPath.bezierCurveTo(
        eyeData.lowerEyelid.cp2.x,
        eyeData.lowerEyelid.cp2.y,
        eyeData.lowerEyelid.cp1.x,
        eyeData.lowerEyelid.cp1.y,
        eyeData.innerCorner.x,
        eyeData.innerCorner.y
      );
      const ctx = p.drawingContext;
      if (ctx instanceof CanvasRenderingContext2D) {
        ctx.clip(clipPath);
      }
    };

    const drawEyeContents = (eyeData: EyeState) => {
      p.push();
      p.noStroke();
      p.fill(p.color(eyeData.iris.color));
      p.ellipse(eyeData.iris.x, eyeData.iris.y, eyeData.iris.w, eyeData.iris.h);
      p.fill(0);
      // Pupil with adjustable width (horizontal scale) and height (vertical scale)
      // When pupilWidthRatio is 0.1 (min), height should be 80% of max (1.0)
      // When pupilWidthRatio is 1.0 (max), height should be 100%
      // Linear interpolation: heightRatio = 0.8 + 0.2 * (pupilWidthRatio - 0.1) / 0.9
      const heightRatio =
        0.7 + (0.3 * (currentProps.pupilWidthRatio - 0.1)) / 0.9;
      p.ellipse(
        eyeData.pupil.x,
        eyeData.pupil.y,
        eyeData.pupil.w * currentProps.pupilWidthRatio,
        eyeData.pupil.h * heightRatio
      );
      p.pop();
    };

    const drawEyeControls = (
      eyeData: EyeState,
      mouseX: number,
      mouseY: number
    ) => {
      p.push();
      p.noFill();
      p.strokeWeight(1.5);
      (p.drawingContext as CanvasRenderingContext2D).setLineDash([4, 4]);
      p.stroke(220, 200, 255);
      p.circle(
        currentProps.eyeState.iris.x,
        currentProps.eyeState.iris.y,
        currentProps.eyeballRadius * currentProps.k_anchorConstraint * 2
      );
      p.stroke(200, 200, 255);
      p.circle(
        currentProps.eyeState.iris.x,
        currentProps.eyeState.iris.y,
        currentProps.eyeballRadius * currentProps.l_irisConstraint * 2
      );
      (p.drawingContext as CanvasRenderingContext2D).setLineDash([]);
      p.pop();

      p.noFill();
      p.stroke(0);
      p.strokeWeight(1.5);
      p.bezier(
        eyeData.innerCorner.x,
        eyeData.innerCorner.y,
        eyeData.upperEyelid.cp1.x,
        eyeData.upperEyelid.cp1.y,
        eyeData.upperEyelid.cp2.x,
        eyeData.upperEyelid.cp2.y,
        eyeData.outerCorner.x,
        eyeData.outerCorner.y
      );
      p.bezier(
        eyeData.innerCorner.x,
        eyeData.innerCorner.y,
        eyeData.lowerEyelid.cp1.x,
        eyeData.lowerEyelid.cp1.y,
        eyeData.lowerEyelid.cp2.x,
        eyeData.lowerEyelid.cp2.y,
        eyeData.outerCorner.x,
        eyeData.outerCorner.y
      );

      p.stroke(200);
      p.strokeWeight(1);
      p.line(
        eyeData.innerCorner.x,
        eyeData.innerCorner.y,
        eyeData.upperEyelid.cp1.x,
        eyeData.upperEyelid.cp1.y
      );
      p.line(
        eyeData.outerCorner.x,
        eyeData.outerCorner.y,
        eyeData.upperEyelid.cp2.x,
        eyeData.upperEyelid.cp2.y
      );
      p.line(
        eyeData.innerCorner.x,
        eyeData.innerCorner.y,
        eyeData.lowerEyelid.cp1.x,
        eyeData.lowerEyelid.cp1.y
      );
      p.line(
        eyeData.outerCorner.x,
        eyeData.outerCorner.y,
        eyeData.lowerEyelid.cp2.x,
        eyeData.lowerEyelid.cp2.y
      );

      const points: {[key: string]: {x: number; y: number}} = {
        innerCorner: eyeData.innerCorner,
        outerCorner: eyeData.outerCorner,
        upperCp1: eyeData.upperEyelid.cp1,
        upperCp2: eyeData.upperEyelid.cp2,
        lowerCp1: eyeData.lowerEyelid.cp1,
        lowerCp2: eyeData.lowerEyelid.cp2,
      };

      for (const [key, pt] of Object.entries(points)) {
        const d = p.dist(mouseX, mouseY, pt.x, pt.y);
        p.strokeWeight(1.5);
        p.stroke(180);
        if (d < pointRadius) {
          p.fill(220, 220, 220);
        } else if (key.includes("Corner")) {
          const isInner = key === "innerCorner";
          const isConstrained = isInner
            ? currentProps.handleModes.inner
            : currentProps.handleModes.outer;
          const modeColor = isConstrained
            ? p.color(236, 72, 153)
            : p.color(20, 184, 166);
          p.fill(modeColor);
          p.stroke(p.lerpColor(modeColor, p.color(0), 0.2));
        } else {
          p.fill(255);
        }
        if (key.includes("Corner")) {
          p.ellipse(pt.x, pt.y, pointRadius * 1.5, pointRadius * 1.5);
        } else {
          p.rectMode(p.CENTER);
          p.square(pt.x, pt.y, pointRadius * 1.5);
        }
      }
    };

    const getTransformedMouse = () => {
      let yOffset = 0;
      if (currentProps.isPreview && !isAnimatingBlink) {
        yOffset = p.sin(p.frameCount * 0.05) * 1.5;
      }

      // 円が通過中の場合は円の位置を使用（マウスカーソルは使用しない）
      let mouseX: number;
      let mouseY: number;

      if (
        currentProps.isCircleActive &&
        currentProps.circlePosition &&
        currentProps.canvasPosition &&
        currentProps.isPupilTracking
      ) {
        // 円の位置（画面座標）をcanvas座標に変換
        // circlePositionは画面全体（viewport）に対する絶対座標
        // canvasPositionはcanvas要素のgetBoundingClientRect()で取得した位置（viewport座標）
        // 両方ともviewport座標なので、差分を取ることでcanvas座標に変換できる
        const circleCanvasX =
          currentProps.circlePosition.x - currentProps.canvasPosition.x;
        const circleCanvasY =
          currentProps.circlePosition.y - currentProps.canvasPosition.y;
        mouseX = circleCanvasX;
        mouseY = circleCanvasY;
      } else {
        // 円が通過中でない場合は、目線追従を無効にするため、中心位置を返す
        const centerX = currentProps.drawSize.width / 2;
        const leftEyeCenterX = centerX - currentProps.eyeSpacing / 2;
        return {
          x: currentProps.eyeState.iris.x - leftEyeCenterX,
          y: currentProps.eyeState.iris.y - yOffset,
        };
      }

      const transformedMouse = transformMouseToDrawArea(mouseX, mouseY);
      const centerX = currentProps.drawSize.width / 2;
      const leftEyeCenterX = centerX - currentProps.eyeSpacing / 2;
      return {
        x: transformedMouse.x - leftEyeCenterX,
        y: transformedMouse.y - yOffset,
      };
    };

    const drawEyes = () => {
      let leftEyeToRender = JSON.parse(JSON.stringify(currentProps.eyeState));
      let rightEyeToRender = JSON.parse(JSON.stringify(currentProps.eyeState));
      const drawWidth = currentProps.drawSize.width;
      const centerX = drawWidth / 2;

      if (isAnimatingBlink) {
        // 閉じるフェーズ（0 → 1）
        if (blinkDirection === 1) {
          blinkProgress += 0.07; // 速度を上げる（0.05 → 0.15）
          if (blinkProgress >= 1) {
            blinkProgress = 1;
            blinkCloseTime = p.millis(); // 閉じた時刻を記録
            blinkDirection = 0; // 閉じた状態を維持
          }
        }
        // 閉じた状態を維持（1秒間）
        else if (blinkDirection === 0 && blinkCloseTime !== null) {
          const elapsed = p.millis() - blinkCloseTime;
          if (elapsed >= 1000) {
            // 1秒経過したら開く
            blinkDirection = -1;
            blinkCloseTime = null;
          }
        }
        // 開くフェーズ（1 → 0）
        else if (blinkDirection === -1) {
          blinkProgress += -0.15; // 速度を上げる
          if (blinkProgress <= 0) {
            blinkProgress = 0;
            isAnimatingBlink = false;
            blinkStartState = null;
            blinkCloseTime = null;
            currentProps.onBlinkFinish();
          }
        }
        if (blinkStartState) {
          const easedProgress = (1 - p.cos(blinkProgress * p.PI)) / 2;
          const animatedState = JSON.parse(JSON.stringify(blinkStartState));
          const t = currentProps.blinkRatio;

          const lerpAngle = (start: number, end: number, amt: number) => {
            let diff = end - start;
            if (diff > p.PI) diff -= p.TWO_PI;
            else if (diff < -p.PI) diff += p.TWO_PI;
            return start + diff * amt;
          };

          const toCartesian = (
            origin: {x: number; y: number},
            r: number,
            angle: number
          ) => ({
            x: origin.x + p.cos(angle) * r,
            y: origin.y + p.sin(angle) * r,
          });

          const up1_vec = p.createVector(
            blinkStartState.upperEyelid.cp1.x - blinkStartState.innerCorner.x,
            blinkStartState.upperEyelid.cp1.y - blinkStartState.innerCorner.y
          );
          const low1_vec = p.createVector(
            blinkStartState.lowerEyelid.cp1.x - blinkStartState.innerCorner.x,
            blinkStartState.lowerEyelid.cp1.y - blinkStartState.innerCorner.y
          );
          const target_r1 = p.lerp(low1_vec.mag(), up1_vec.mag(), t);
          const target_a1 = lerpAngle(low1_vec.heading(), up1_vec.heading(), t);
          const targetCp1 = toCartesian(
            blinkStartState.innerCorner,
            target_r1,
            target_a1
          );

          const up2_vec = p.createVector(
            blinkStartState.upperEyelid.cp2.x - blinkStartState.outerCorner.x,
            blinkStartState.upperEyelid.cp2.y - blinkStartState.outerCorner.y
          );
          const low2_vec = p.createVector(
            blinkStartState.lowerEyelid.cp2.x - blinkStartState.outerCorner.x,
            blinkStartState.lowerEyelid.cp2.y - blinkStartState.outerCorner.y
          );
          const target_r2 = p.lerp(low2_vec.mag(), up2_vec.mag(), t);
          const target_a2 = lerpAngle(low2_vec.heading(), up2_vec.heading(), t);
          const targetCp2 = toCartesian(
            blinkStartState.outerCorner,
            target_r2,
            target_a2
          );

          animatedState.upperEyelid.cp1.x = p.lerp(
            blinkStartState.upperEyelid.cp1.x,
            targetCp1.x,
            easedProgress
          );
          animatedState.upperEyelid.cp1.y = p.lerp(
            blinkStartState.upperEyelid.cp1.y,
            targetCp1.y,
            easedProgress
          );
          animatedState.lowerEyelid.cp1.x = p.lerp(
            blinkStartState.lowerEyelid.cp1.x,
            targetCp1.x,
            easedProgress
          );
          animatedState.lowerEyelid.cp1.y = p.lerp(
            blinkStartState.lowerEyelid.cp1.y,
            targetCp1.y,
            easedProgress
          );

          animatedState.upperEyelid.cp2.x = p.lerp(
            blinkStartState.upperEyelid.cp2.x,
            targetCp2.x,
            easedProgress
          );
          animatedState.upperEyelid.cp2.y = p.lerp(
            blinkStartState.upperEyelid.cp2.y,
            targetCp2.y,
            easedProgress
          );
          animatedState.lowerEyelid.cp2.x = p.lerp(
            blinkStartState.lowerEyelid.cp2.x,
            targetCp2.x,
            easedProgress
          );
          animatedState.lowerEyelid.cp2.y = p.lerp(
            blinkStartState.lowerEyelid.cp2.y,
            targetCp2.y,
            easedProgress
          );

          leftEyeToRender = animatedState;
          rightEyeToRender = JSON.parse(JSON.stringify(animatedState));
        }
      } else if (
        currentProps.isPupilTracking ||
        pupilEasingStartTime !== null
      ) {
        const irisMovableRadius =
          currentProps.eyeballRadius * currentProps.l_irisConstraint;
        const irisRadius = currentProps.eyeState.iris.w / 2;
        const maxIrisOffset = irisMovableRadius - irisRadius;
        const finalMaxOffset = Math.max(0, maxIrisOffset);

        // 目線追従の開始/終了を検出
        if (currentProps.isPupilTracking !== previousPupilTracking) {
          if (currentProps.isPupilTracking) {
            // 目線追従開始：中心位置から目標位置へイージング
            pupilEasingStartOffset = {
              x: currentPupilOffset.x,
              y: currentPupilOffset.y,
            };
            pupilEasingStartTime = p.millis();
          } else {
            // 目線追従終了：現在位置から中心位置へイージング
            pupilEasingStartOffset = {
              x: currentPupilOffset.x,
              y: currentPupilOffset.y,
            };
            pupilEasingTargetOffset = {x: 0, y: 0};
            pupilEasingStartTime = p.millis();
          }
          previousPupilTracking = currentProps.isPupilTracking;
        }

        let offsetVec: {x: number; y: number};

        if (pupilEasingStartTime !== null) {
          // イージング中
          const elapsed = p.millis() - pupilEasingStartTime;
          const easingDuration = 300; // 0.3秒
          const progress = Math.min(elapsed / easingDuration, 1);

          // ease-in-out easing
          const easedProgress =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          if (currentProps.isPupilTracking) {
            // 追従開始中：目標位置を計算
            const leftTransformedMouse = getTransformedMouse();
            const irisCenter = p.createVector(
              currentProps.eyeState.iris.x,
              currentProps.eyeState.iris.y
            );
            const targetOffsetVec = p.createVector(
              leftTransformedMouse.x - irisCenter.x,
              leftTransformedMouse.y - irisCenter.y
            );
            targetOffsetVec.limit(finalMaxOffset);
            pupilEasingTargetOffset = {
              x: targetOffsetVec.x,
              y: targetOffsetVec.y,
            };
          }

          // イージング計算
          offsetVec = {
            x: p.lerp(
              pupilEasingStartOffset.x,
              pupilEasingTargetOffset.x,
              easedProgress
            ),
            y: p.lerp(
              pupilEasingStartOffset.y,
              pupilEasingTargetOffset.y,
              easedProgress
            ),
          };

          if (progress >= 1) {
            // イージング完了
            pupilEasingStartTime = null;
            if (!currentProps.isPupilTracking) {
              // 追従終了後は中心位置に戻す
              offsetVec = {x: 0, y: 0};
            }
          }
        } else if (currentProps.isPupilTracking) {
          // イージング完了後、追従中：直接計算
          const leftTransformedMouse = getTransformedMouse();
          const irisCenter = p.createVector(
            currentProps.eyeState.iris.x,
            currentProps.eyeState.iris.y
          );
          const targetOffsetVec = p.createVector(
            leftTransformedMouse.x - irisCenter.x,
            leftTransformedMouse.y - irisCenter.y
          );
          targetOffsetVec.limit(finalMaxOffset);
          offsetVec = {x: targetOffsetVec.x, y: targetOffsetVec.y};
        } else {
          // 追従していない：中心位置
          offsetVec = {x: 0, y: 0};
        }

        // 現在のオフセットを記録
        currentPupilOffset = {x: offsetVec.x, y: offsetVec.y};

        leftEyeToRender.iris.x += offsetVec.x;
        leftEyeToRender.iris.y += offsetVec.y;
        leftEyeToRender.pupil.x += offsetVec.x;
        leftEyeToRender.pupil.y += offsetVec.y;

        const offset = getOffset();
        // 右目の移動計算用：円が通過中の場合は円の位置を使用、そうでない場合は左目と同じ位置を使用（目線追従は無効）
        let trackingX: number;
        let trackingY: number;
        if (
          currentProps.isCircleActive &&
          currentProps.circlePosition &&
          currentProps.canvasPosition
        ) {
          // 円が通過中の場合は円の位置を使用
          trackingX =
            currentProps.circlePosition.x - currentProps.canvasPosition.x;
          trackingY =
            currentProps.circlePosition.y - currentProps.canvasPosition.y;
        } else {
          // 円が通過中でない場合は、左目と同じ位置を使用（目線追従は無効なので中心位置）
          // 左目の中心位置をcanvas座標に変換
          const centerX = currentProps.drawSize.width / 2;
          const leftEyeCenterX = centerX - currentProps.eyeSpacing / 2;
          const irisCenterX = currentProps.eyeState.iris.x;
          const irisCenterY = currentProps.eyeState.iris.y;
          trackingX = leftEyeCenterX + irisCenterX + offset.x;
          trackingY = irisCenterY + offset.y;
        }
        const transformedMouse = transformMouseToDrawArea(trackingX, trackingY);
        const centerX = currentProps.drawSize.width / 2;
        const leftEyeWorldCenterX =
          centerX - currentProps.eyeSpacing / 2 + offset.x;
        const rightEyeWorldCenterX =
          centerX + currentProps.eyeSpacing / 2 + offset.x;
        const isCrossEyed =
          transformedMouse.x > leftEyeWorldCenterX - offset.x &&
          transformedMouse.x < rightEyeWorldCenterX - offset.x;

        rightEyeToRender.iris.y += offsetVec.y;
        rightEyeToRender.pupil.y += offsetVec.y;
        if (isCrossEyed) {
          rightEyeToRender.iris.x += offsetVec.x;
          rightEyeToRender.pupil.x += offsetVec.x;
        } else {
          rightEyeToRender.iris.x -= offsetVec.x;
          rightEyeToRender.pupil.x -= offsetVec.x;
        }
      } else {
        // 目線追従が無効になった時、イージングで中心位置に戻す
        if (previousPupilTracking && !currentProps.isPupilTracking) {
          if (pupilEasingStartTime === null) {
            pupilEasingStartOffset = {
              x: currentPupilOffset.x,
              y: currentPupilOffset.y,
            };
            pupilEasingTargetOffset = {x: 0, y: 0};
            pupilEasingStartTime = p.millis();
          }
        }
        previousPupilTracking = currentProps.isPupilTracking;

        // イージング中の場合
        if (pupilEasingStartTime !== null) {
          const elapsed = p.millis() - pupilEasingStartTime;
          const easingDuration = 300; // 0.3秒
          const progress = Math.min(elapsed / easingDuration, 1);

          // ease-in-out easing
          const easedProgress =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const offsetVec = {
            x: p.lerp(
              pupilEasingStartOffset.x,
              pupilEasingTargetOffset.x,
              easedProgress
            ),
            y: p.lerp(
              pupilEasingStartOffset.y,
              pupilEasingTargetOffset.y,
              easedProgress
            ),
          };

          currentPupilOffset = {x: offsetVec.x, y: offsetVec.y};

          leftEyeToRender.iris.x += offsetVec.x;
          leftEyeToRender.iris.y += offsetVec.y;
          leftEyeToRender.pupil.x += offsetVec.x;
          leftEyeToRender.pupil.y += offsetVec.y;

          // 右目も同じオフセットを適用（中心に戻る時は常に同じ方向）
          rightEyeToRender.iris.y += offsetVec.y;
          rightEyeToRender.pupil.y += offsetVec.y;
          rightEyeToRender.iris.x += offsetVec.x;
          rightEyeToRender.pupil.x += offsetVec.x;

          if (progress >= 1) {
            // イージング完了
            pupilEasingStartTime = null;
            currentPupilOffset = {x: 0, y: 0};
          }
        } else {
          // イージング完了後、中心位置
          currentPupilOffset = {x: 0, y: 0};
        }
      }

      let yOffset = 0;
      if (currentProps.isPreview && !isAnimatingBlink) {
        yOffset = p.sin(p.frameCount * 0.05) * 1.5;
      }

      const leftEyeCenterX = centerX - currentProps.eyeSpacing / 2;
      p.push();
      p.translate(leftEyeCenterX, yOffset);
      p.push();
      // Always apply clip path
      applyClipPath(leftEyeToRender);
      p.fill(currentProps.eyeballColor);
      p.noStroke();
      p.circle(
        currentProps.eyeState.iris.x,
        currentProps.eyeState.iris.y,
        currentProps.eyeballRadius * 2
      );
      drawEyeContents(leftEyeToRender);
      p.pop();
      if (!currentProps.isPreview) {
        const transformedMouse = transformMouseToDrawArea(p.mouseX, p.mouseY);
        drawEyeControls(
          leftEyeToRender,
          transformedMouse.x - leftEyeCenterX,
          transformedMouse.y - yOffset
        );
      }
      p.pop();

      const rightEyeCenterX = centerX + currentProps.eyeSpacing / 2;
      p.push();
      p.translate(rightEyeCenterX, yOffset);
      p.scale(-1, 1);
      p.push();
      // Always apply clip path
      applyClipPath(rightEyeToRender);
      p.fill(currentProps.eyeballColor);
      p.noStroke();
      p.circle(
        currentProps.eyeState.iris.x,
        currentProps.eyeState.iris.y,
        currentProps.eyeballRadius * 2
      );
      drawEyeContents(rightEyeToRender);
      p.pop();
      p.pop();
    };

    // ===== MAIN DRAW LOOP =====

    p.draw = () => {
      // Clear background (transparent)
      p.clear();

      // Apply translate to shift drawing area (10% offset)
      const offset = getOffset();
      p.push();
      p.translate(offset.x, offset.y);

      // Draw background rectangle 10% smaller (centered)
      const margin = currentProps.drawSize.width * 0.015;
      const bgWidth = currentProps.drawSize.width * 0.97;
      const bgHeight = currentProps.drawSize.height * 0.97;
      p.noStroke();
      p.fill(currentProps.textureSettings.backgroundColor);
      p.rect(margin, margin, bgWidth, bgHeight);

      // Draw edge fur pattern in the margin area
      drawEdgeFur();

      // Ensure texture grid is initialized
      const n = currentProps.textureSettings.density;
      ensureGridSize(n);

      // Handle texture painting
      const transformedMouse = transformMouseToDrawArea(p.mouseX, p.mouseY);
      const mouseInDrawArea =
        transformedMouse.x >= 0 &&
        transformedMouse.x < currentProps.drawSize.width &&
        transformedMouse.y >= 0 &&
        transformedMouse.y < currentProps.drawSize.height;

      if (
        currentProps.activeMode === "texture" &&
        p.mouseIsPressed &&
        mouseInDrawArea
      ) {
        paintAt(
          transformedMouse.x,
          transformedMouse.y,
          currentProps.textureSettings.brushRadius,
          currentProps.textureSettings.brushColor,
          n
        );
      }

      // Draw layers in order: fur pattern -> eyes -> nose
      drawFurPattern();
      drawEyes();
      drawNose();

      p.pop();

      // Draw brush cursor for texture mode (outside translate)
      drawTextureBrushCursor();
    };

    // ===== MOUSE EVENT HANDLERS =====

    p.mousePressed = () => {
      // 鼻のあたりをクリックしたときに瞬きをトリガー
      const transformedMouse = transformMouseToDrawArea(p.mouseX, p.mouseY);
      const centerX = currentProps.drawSize.width / 2;
      const noseY = currentProps.noseSettings.y;
      const scale = currentProps.noseSettings.scale;
      const noseWidth = 67.29 * scale;
      const noseHeight = 44.59 * scale;
      const noseLeft = centerX - noseWidth / 2;
      const noseRight = centerX + noseWidth / 2;
      const noseTop = noseY - noseHeight / 2;
      const noseBottom = noseY + noseHeight / 2;

      // 鼻のあたりをクリックしたかチェック（少し余裕を持たせる）
      const clickMargin = 20;
      if (
        transformedMouse.x >= noseLeft - clickMargin &&
        transformedMouse.x <= noseRight + clickMargin &&
        transformedMouse.y >= noseTop - clickMargin &&
        transformedMouse.y <= noseBottom + clickMargin
      ) {
        // 円が通過中でない場合のみ瞬きをトリガー
        if (
          !currentProps.isCircleActive &&
          currentProps.animationStatus !== "blinking"
        ) {
          currentProps.setAnimationStatus("blinking");
        }
        return;
      }

      if (currentProps.activeMode !== "eye") return;
      if (isAnimatingBlink || currentProps.isPupilTracking) return;

      const currentEyeState = currentProps.eyeState;

      const points: {[key: string]: {x: number; y: number}} = {
        innerCorner: currentEyeState.innerCorner,
        outerCorner: currentEyeState.outerCorner,
        upperCp1: currentEyeState.upperEyelid.cp1,
        upperCp2: currentEyeState.upperEyelid.cp2,
        lowerCp1: currentEyeState.lowerEyelid.cp1,
        lowerCp2: currentEyeState.lowerEyelid.cp2,
      };
      let closestPoint = null;
      let minDistance = Infinity;

      for (const [key, pt] of Object.entries(points)) {
        const d = p.dist(transformedMouse.x, transformedMouse.y, pt.x, pt.y);
        if (d < pointRadius * 2 && d < minDistance) {
          minDistance = d;
          closestPoint = key;
        }
      }

      if (closestPoint) {
        draggingPoint = closestPoint;
        const pointCoords = points[draggingPoint];
        dragOffset = {
          x: transformedMouse.x - pointCoords.x,
          y: transformedMouse.y - pointCoords.y,
        };
        return;
      }

      const distToIrisCenter = p.dist(
        transformedMouse.x,
        transformedMouse.y,
        currentEyeState.iris.x,
        currentEyeState.iris.y
      );
      const irisMovableRadius =
        currentProps.eyeballRadius * currentProps.l_irisConstraint;
      if (Math.abs(distToIrisCenter - irisMovableRadius) < pointRadius * 1.5) {
        draggingPoint = "irisConstraintCircle";
        return;
      }
      if (
        Math.abs(
          distToIrisCenter -
            currentProps.eyeballRadius * currentProps.k_anchorConstraint
        ) <
        pointRadius * 1.5
      ) {
        draggingPoint = "anchorConstraintCircle";
        return;
      }
    };

    p.doubleClicked = () => {
      if (currentProps.activeMode !== "eye") return;
      if (isAnimatingBlink || currentProps.isPupilTracking) return;

      const transformedMouse = getTransformedMouse();
      const currentEyeState = currentProps.eyeState;
      const innerDist = p.dist(
        transformedMouse.x,
        transformedMouse.y,
        currentEyeState.innerCorner.x,
        currentEyeState.innerCorner.y
      );
      const outerDist = p.dist(
        transformedMouse.x,
        transformedMouse.y,
        currentEyeState.outerCorner.x,
        currentEyeState.outerCorner.y
      );
      if (innerDist < pointRadius * 2) {
        currentProps.setHandleModes((prev: HandleModes) => ({
          ...prev,
          inner: !prev.inner,
        }));
      } else if (outerDist < pointRadius * 2) {
        currentProps.setHandleModes((prev: HandleModes) => ({
          ...prev,
          outer: !prev.outer,
        }));
      }
    };

    p.mouseDragged = () => {
      if (currentProps.activeMode !== "eye") return;
      if (!draggingPoint) return;

      const transformedMouse = getTransformedMouse();

      if (draggingPoint === "irisConstraintCircle") {
        const newRadius = p.dist(
          transformedMouse.x,
          transformedMouse.y,
          currentProps.eyeState.iris.x,
          currentProps.eyeState.iris.y
        );
        const newL = p.constrain(
          newRadius / currentProps.eyeballRadius,
          currentProps.m_irisScale,
          1.0
        );
        currentProps.setL_irisConstraint(newL);
        return;
      }
      if (draggingPoint === "anchorConstraintCircle") {
        const newRadius = p.dist(
          transformedMouse.x,
          transformedMouse.y,
          currentProps.eyeState.iris.x,
          currentProps.eyeState.iris.y
        );
        const newK = p.constrain(
          newRadius / currentProps.eyeballRadius,
          0.1,
          1.0
        );
        currentProps.setK_anchorConstraint(newK);
        return;
      }

      currentProps.setEyeState((prevState: EyeState) => {
        const newState = JSON.parse(JSON.stringify(prevState)) as EyeState;
        const newPosRaw = {
          x: transformedMouse.x - dragOffset.x,
          y: transformedMouse.y - dragOffset.y,
        };

        const calculateConstrainedPos = (
          pivot: {x: number; y: number},
          draggedHandlePos: {x: number; y: number},
          oppositeHandleOriginalPos: {x: number; y: number}
        ) => {
          const dist = p.dist(
            oppositeHandleOriginalPos.x,
            oppositeHandleOriginalPos.y,
            pivot.x,
            pivot.y
          );
          const vecX = draggedHandlePos.x - pivot.x;
          const vecY = draggedHandlePos.y - pivot.y;
          const mag = p.dist(0, 0, vecX, vecY);
          if (mag > 0) {
            const normOppositeVecX = -vecX / mag;
            const normOppositeVecY = -vecY / mag;
            return {
              x: pivot.x + normOppositeVecX * dist,
              y: pivot.y + normOppositeVecY * dist,
            };
          }
          return oppositeHandleOriginalPos;
        };

        let newPos;

        switch (draggingPoint) {
          case "innerCorner":
          case "outerCorner": {
            const eyeballCenter = {x: prevState.iris.x, y: prevState.iris.y};
            const vec = p.createVector(
              newPosRaw.x - eyeballCenter.x,
              newPosRaw.y - eyeballCenter.y
            );
            vec.setMag(
              currentProps.eyeballRadius * currentProps.k_anchorConstraint
            );
            newPos = {x: eyeballCenter.x + vec.x, y: eyeballCenter.y + vec.y};

            const prevCorner =
              draggingPoint === "innerCorner"
                ? prevState.innerCorner
                : prevState.outerCorner;
            const deltaX = newPos.x - prevCorner.x;
            const deltaY = newPos.y - prevCorner.y;

            if (draggingPoint === "innerCorner") {
              newState.innerCorner = newPos;
              newState.upperEyelid.cp1.x += deltaX;
              newState.upperEyelid.cp1.y += deltaY;
              newState.lowerEyelid.cp1.x += deltaX;
              newState.lowerEyelid.cp1.y += deltaY;
            } else {
              newState.outerCorner = newPos;
              newState.upperEyelid.cp2.x += deltaX;
              newState.upperEyelid.cp2.y += deltaY;
              newState.lowerEyelid.cp2.x += deltaX;
              newState.lowerEyelid.cp2.y += deltaY;
            }
            break;
          }
          case "upperCp1":
            newPos = newPosRaw;
            newState.upperEyelid.cp1 = newPos;
            if (currentProps.handleModes.inner) {
              newState.lowerEyelid.cp1 = calculateConstrainedPos(
                newState.innerCorner,
                newPos,
                prevState.lowerEyelid.cp1
              );
            }
            break;
          case "lowerCp1":
            newPos = newPosRaw;
            newState.lowerEyelid.cp1 = newPos;
            if (currentProps.handleModes.inner) {
              newState.upperEyelid.cp1 = calculateConstrainedPos(
                newState.innerCorner,
                newPos,
                prevState.upperEyelid.cp1
              );
            }
            break;
          case "upperCp2":
            newPos = newPosRaw;
            newState.upperEyelid.cp2 = newPos;
            if (currentProps.handleModes.outer) {
              newState.lowerEyelid.cp2 = calculateConstrainedPos(
                newState.outerCorner,
                newPos,
                prevState.lowerEyelid.cp2
              );
            }
            break;
          case "lowerCp2":
            newPos = newPosRaw;
            newState.lowerEyelid.cp2 = newPos;
            if (currentProps.handleModes.outer) {
              newState.upperEyelid.cp2 = calculateConstrainedPos(
                newState.outerCorner,
                newPos,
                prevState.upperEyelid.cp2
              );
            }
            break;
        }
        return newState;
      });
    };

    p.mouseReleased = () => {
      draggingPoint = null;
    };

    p.keyPressed = () => {
      if (
        currentProps.activeMode === "texture" &&
        (p.key === "r" || p.key === "R")
      ) {
        if (currentProps.onResetBrush) {
          currentProps.onResetBrush();
        }
        for (let i = 0; i < gridUsesBase.length; i++) {
          gridUsesBase[i].fill(true);
        }
      }
    };
  };
};
