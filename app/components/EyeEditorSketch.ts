import type p5Type from "p5";
import type {EyeState, HandleModes} from "../types";

interface EyeEditorProps {
  eyeState: EyeState;
  setEyeState: React.Dispatch<React.SetStateAction<EyeState>>;
  isPreview: boolean;
  handleModes: HandleModes;
  setHandleModes: React.Dispatch<React.SetStateAction<HandleModes>>;
  animationStatus: string;
  onBlinkFinish: () => void;
  eyeSpacing: number;
  isPupilTracking: boolean;
  canvasSize: {width: number; height: number};
  eyeballColor: string;
  eyeballRadius: number;
  k_anchorConstraint: number;
  setK_anchorConstraint: (value: number) => void;
  l_irisConstraint: number;
  setL_irisConstraint: (value: number) => void;
  m_irisScale: number;
  blinkRatio: number;
  isActive?: boolean;
}

export const createEyeEditorSketch = () => {
  return (p: p5Type, props: Record<string, unknown>) => {
    let currentProps = props as unknown as EyeEditorProps;
    let draggingPoint: string | null = null;
    let dragOffset = {x: 0, y: 0};
    const pointRadius = 8;

    let isAnimatingBlink = false;
    let blinkProgress = 0;
    let blinkDirection = 1;
    let blinkStartState: EyeState | null = null;

    p.setup = () => {
      p.createCanvas(
        currentProps.canvasSize.width,
        currentProps.canvasSize.height
      );
      p.pixelDensity(p.displayDensity());
      p.colorMode(p.RGB);
    };

    (
      p as p5Type & {
        updateWithProps?: (newProps: Record<string, unknown>) => void;
      }
    ).updateWithProps = (newProps: Record<string, unknown>) => {
      const typedProps = newProps as unknown as EyeEditorProps;
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
        blinkStartState = JSON.parse(JSON.stringify(typedProps.eyeState));
      }
      currentProps = typedProps;
    };

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
      p.drawingContext.clip(clipPath);
    };

    const drawEyeContents = (eyeData: EyeState) => {
      p.stroke(0);
      p.strokeWeight(4);
      p.fill(p.color(eyeData.iris.color));
      p.ellipse(eyeData.iris.x, eyeData.iris.y, eyeData.iris.w, eyeData.iris.h);
      p.noStroke();
      p.fill(0);
      p.ellipse(
        eyeData.pupil.x,
        eyeData.pupil.y,
        eyeData.pupil.w,
        eyeData.pupil.h
      );
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
      const centerX = currentProps.canvasSize.width / 2;
      const leftEyeCenterX = centerX - currentProps.eyeSpacing / 2;
      return {x: p.mouseX - leftEyeCenterX, y: p.mouseY - yOffset};
    };

    p.draw = () => {
      let leftEyeToRender = JSON.parse(JSON.stringify(currentProps.eyeState));
      let rightEyeToRender = JSON.parse(JSON.stringify(currentProps.eyeState));
      const canvasWidth = currentProps.canvasSize.width;
      const centerX = canvasWidth / 2;

      if (isAnimatingBlink) {
        blinkProgress += blinkDirection * 0.05;
        if (blinkProgress >= 1) {
          blinkProgress = 1;
          blinkDirection = -1;
        } else if (blinkProgress <= 0 && blinkDirection === -1) {
          isAnimatingBlink = false;
          blinkStartState = null;
          currentProps.onBlinkFinish();
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
      } else if (currentProps.isPupilTracking) {
        const irisMovableRadius =
          currentProps.eyeballRadius * currentProps.l_irisConstraint;
        const irisRadius = currentProps.eyeState.iris.w / 2;
        const maxIrisOffset = irisMovableRadius - irisRadius;
        const finalMaxOffset = Math.max(0, maxIrisOffset);

        const leftTransformedMouse = getTransformedMouse();
        const irisCenter = p.createVector(
          currentProps.eyeState.iris.x,
          currentProps.eyeState.iris.y
        );
        const offsetVec = p.createVector(
          leftTransformedMouse.x - irisCenter.x,
          leftTransformedMouse.y - irisCenter.y
        );
        offsetVec.limit(finalMaxOffset);

        leftEyeToRender.iris.x += offsetVec.x;
        leftEyeToRender.iris.y += offsetVec.y;
        leftEyeToRender.pupil.x += offsetVec.x;
        leftEyeToRender.pupil.y += offsetVec.y;

        const leftEyeWorldCenterX = centerX - currentProps.eyeSpacing / 2;
        const rightEyeWorldCenterX = centerX + currentProps.eyeSpacing / 2;
        const isCrossEyed =
          p.mouseX > leftEyeWorldCenterX && p.mouseX < rightEyeWorldCenterX;

        rightEyeToRender.iris.y += offsetVec.y;
        rightEyeToRender.pupil.y += offsetVec.y;
        if (isCrossEyed) {
          rightEyeToRender.iris.x += offsetVec.x;
          rightEyeToRender.pupil.x += offsetVec.x;
        } else {
          rightEyeToRender.iris.x -= offsetVec.x;
          rightEyeToRender.pupil.x -= offsetVec.x;
        }
      }

      p.clear();

      (p.drawingContext as CanvasRenderingContext2D).setLineDash([5, 5]);
      p.stroke(220, 220, 220);
      p.strokeWeight(1);
      p.line(centerX, 0, centerX, p.height);
      (p.drawingContext as CanvasRenderingContext2D).setLineDash([]);

      let yOffset = 0;
      if (currentProps.isPreview && !isAnimatingBlink) {
        yOffset = p.sin(p.frameCount * 0.05) * 1.5;
      }

      const leftEyeCenterX = centerX - currentProps.eyeSpacing / 2;
      p.push();
      p.translate(leftEyeCenterX, yOffset);
      p.push();
      if (isAnimatingBlink && blinkStartState) {
        applyClipPath(blinkStartState);
      }
      if (currentProps.isPreview || isAnimatingBlink) {
        applyClipPath(leftEyeToRender);
      }
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
        drawEyeControls(
          leftEyeToRender,
          p.mouseX - leftEyeCenterX,
          p.mouseY - yOffset
        );
      }
      p.pop();

      const rightEyeCenterX = centerX + currentProps.eyeSpacing / 2;
      p.push();
      p.translate(rightEyeCenterX, yOffset);
      p.scale(-1, 1);
      p.push();
      if (isAnimatingBlink && blinkStartState) {
        applyClipPath(blinkStartState);
      }
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

    p.mousePressed = () => {
      if (
        !currentProps.isActive ||
        isAnimatingBlink ||
        currentProps.isPupilTracking
      )
        return;
      const transformedMouse = getTransformedMouse();
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
      if (
        !currentProps.isActive ||
        isAnimatingBlink ||
        currentProps.isPupilTracking
      )
        return;
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
      if (!currentProps.isActive || !draggingPoint) return;

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
  };
};
