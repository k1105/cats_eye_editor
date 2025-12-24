import type p5Type from "p5";
import type {EyeState, HandleModes, NoseSettings} from "../types";

export interface EyeDrawingContext {
  p: p5Type;
  eyeState: EyeState;
  handleModes: HandleModes;
  eyeballColor: string;
  eyeballRadius: number;
  k_anchorConstraint: number;
  l_irisConstraint: number;
  pupilWidthRatio: number;
  isPreview: boolean;
  drawSize: {width: number; height: number};
  eyeSpacing: number;
  canvasSize: {width: number; height: number};
  controlsOpacity?: number;
}

export const applyClipPath = (p: p5Type, eyeData: EyeState) => {
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

export const drawEyeContents = (
  p: p5Type,
  eyeData: EyeState,
  pupilWidthRatio: number
) => {
  p.push();
  p.noStroke();
  p.fill(p.color(eyeData.iris.color));
  p.ellipse(eyeData.iris.x, eyeData.iris.y, eyeData.iris.w, eyeData.iris.h);
  p.fill(0);
  // Pupil with adjustable width (horizontal scale) and height (vertical scale)
  const heightRatio = 0.7 + (0.3 * (pupilWidthRatio - 0.1)) / 0.9;
  p.ellipse(
    eyeData.pupil.x,
    eyeData.pupil.y,
    eyeData.pupil.w * pupilWidthRatio,
    eyeData.pupil.h * heightRatio
  );
  p.pop();
};

const POINT_RADIUS = 8;

export const drawEyeControls = (
  context: EyeDrawingContext,
  eyeData: EyeState,
  mouseX: number,
  mouseY: number
) => {
  const {
    p,
    eyeState,
    handleModes,
    eyeballRadius,
    k_anchorConstraint,
    l_irisConstraint,
    controlsOpacity = 1.0,
  } = context;
  const pointRadius = POINT_RADIUS;

  // If opacity is 0, don't draw anything
  if (controlsOpacity <= 0) return;

  p.push();

  // Apply opacity to all drawing
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  ctx.globalAlpha = controlsOpacity;

  p.noFill();
  p.strokeWeight(1.5);
  ctx.setLineDash([4, 4]);
  p.stroke(220, 200, 255);
  p.circle(
    eyeState.iris.x,
    eyeState.iris.y,
    eyeballRadius * k_anchorConstraint * 2
  );
  p.stroke(200, 200, 255);
  p.circle(
    eyeState.iris.x,
    eyeState.iris.y,
    eyeballRadius * l_irisConstraint * 2
  );
  ctx.setLineDash([]);
  p.pop();

  p.push();
  ctx.globalAlpha = controlsOpacity;

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
      const isConstrained = isInner ? handleModes.inner : handleModes.outer;
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

  p.pop();
};

export const drawNose = (
  p: p5Type,
  noseSettings: NoseSettings,
  drawSize: {width: number; height: number}
) => {
  const centerX = drawSize.width / 2;
  const noseY = noseSettings.y;
  const scale = noseSettings.scale;

  p.push();
  p.translate(centerX, noseY);
  p.scale(scale);

  // SVG viewBox: 0 0 67.29 44.59
  // Center the nose horizontally
  p.translate(-67.29 / 2, -44.59 / 2);

  // Draw the nose path from nose.svg
  p.fill(noseSettings.color);
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
