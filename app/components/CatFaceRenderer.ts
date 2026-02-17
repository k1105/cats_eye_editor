/**
 * Shared cat face rendering module.
 * Provides eye drawing without editor controls, for use in gallery previews.
 */

import type p5Type from "p5";
import type {EyeState} from "../types";
import {applyClipPath, drawEyeContents} from "./EyeDrawing";

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Draw a single eye with pupil offset applied (no editor controls).
 * Caller must set up the coordinate transform (push/translate/scale) beforehand if needed.
 */
export function drawSingleEyePreview(
  p: p5Type,
  eyeState: EyeState,
  pupilOffset: {x: number; y: number},
  offsetX: number,
  offsetY: number,
  isLeft: boolean,
  eyeballColor: string,
  eyeballRadius: number,
  pupilWidthRatio: number
) {
  p.push();
  p.translate(offsetX, offsetY);
  if (!isLeft) p.scale(-1, 1);

  const renderState = deepClone(eyeState);
  renderState.iris.x += pupilOffset.x;
  renderState.iris.y += pupilOffset.y;
  renderState.pupil.x += pupilOffset.x;
  renderState.pupil.y += pupilOffset.y;

  applyClipPath(p, renderState);
  p.fill(eyeballColor);
  p.noStroke();
  p.circle(renderState.iris.x, renderState.iris.y, eyeballRadius * 2);
  drawEyeContents(p, renderState, pupilWidthRatio);

  p.pop();
}
