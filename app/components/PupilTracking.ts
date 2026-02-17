/**
 * Shared pupil tracking module.
 * Extracted from UnifiedEditorSketch.ts for reuse in both editor and gallery.
 */

export interface Point {
  x: number;
  y: number;
}

interface EyeOffsetState {
  startOffset: Point;
  targetOffset: Point;
  currentOffset: Point;
}

export interface PupilTrackingState {
  isTracking: boolean;
  easingStartTime: number | null;
  left: EyeOffsetState;
  right: EyeOffsetState;
}

export function createPupilTrackingState(): PupilTrackingState {
  return {
    isTracking: false,
    easingStartTime: null,
    left: {
      startOffset: {x: 0, y: 0},
      targetOffset: {x: 0, y: 0},
      currentOffset: {x: 0, y: 0},
    },
    right: {
      startOffset: {x: 0, y: 0},
      targetOffset: {x: 0, y: 0},
      currentOffset: {x: 0, y: 0},
    },
  };
}

const PUPIL_EASING_DURATION = 300;

export interface PupilUpdateParams {
  targetPos: Point;
  leftEyeCenterX: number;
  rightEyeCenterX: number;
  irisX: number;
  irisY: number;
  eyeSpacing: number;
  eyeballRadius: number;
  l_irisConstraint: number;
  irisWidth: number;
  isPupilTracking: boolean;
  currentTimeMs: number;
  lerpFn: (a: number, b: number, t: number) => number;
}

export function updatePupilOffsets(
  state: PupilTrackingState,
  params: PupilUpdateParams
): {left: Point; right: Point} {
  const {
    targetPos,
    leftEyeCenterX,
    rightEyeCenterX,
    irisX,
    irisY,
    eyeSpacing,
    eyeballRadius,
    l_irisConstraint,
    irisWidth,
    isPupilTracking,
    currentTimeMs,
    lerpFn,
  } = params;

  // Detect tracking mode change
  if (isPupilTracking !== state.isTracking) {
    state.left.startOffset = {...state.left.currentOffset};
    state.right.startOffset = {...state.right.currentOffset};
    state.easingStartTime = currentTimeMs;
    if (!isPupilTracking) {
      state.left.targetOffset = {x: 0, y: 0};
      state.right.targetOffset = {x: 0, y: 0};
    }
    state.isTracking = isPupilTracking;
  }

  if (isPupilTracking) {
    const irisMovableRadius = eyeballRadius * l_irisConstraint;
    const maxOffset = Math.max(0, irisMovableRadius - irisWidth / 2);

    // Virtual depth model for natural convergence
    const virtualDepth = eyeSpacing;

    // Left eye
    const ldx = targetPos.x - (leftEyeCenterX + irisX);
    const ldy = targetPos.y - irisY;
    const lDist3D = Math.sqrt(
      ldx * ldx + ldy * ldy + virtualDepth * virtualDepth
    );
    state.left.targetOffset = {
      x: (maxOffset * ldx) / lDist3D,
      y: (maxOffset * ldy) / lDist3D,
    };

    // Right eye (irisX is negated due to scale(-1,1) flip)
    const rdx = targetPos.x - (rightEyeCenterX - irisX);
    const rdy = targetPos.y - irisY;
    const rDist3D = Math.sqrt(
      rdx * rdx + rdy * rdy + virtualDepth * virtualDepth
    );
    state.right.targetOffset = {
      x: -(maxOffset * rdx) / rDist3D,
      y: (maxOffset * rdy) / rDist3D,
    };
  }

  // Easing interpolation
  if (state.easingStartTime !== null) {
    const elapsed = currentTimeMs - state.easingStartTime;
    const progress = Math.min(elapsed / PUPIL_EASING_DURATION, 1);
    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    state.left.currentOffset = {
      x: lerpFn(state.left.startOffset.x, state.left.targetOffset.x, eased),
      y: lerpFn(state.left.startOffset.y, state.left.targetOffset.y, eased),
    };
    state.right.currentOffset = {
      x: lerpFn(state.right.startOffset.x, state.right.targetOffset.x, eased),
      y: lerpFn(state.right.startOffset.y, state.right.targetOffset.y, eased),
    };

    if (progress >= 1) state.easingStartTime = null;
  } else if (isPupilTracking) {
    state.left.currentOffset = {...state.left.targetOffset};
    state.right.currentOffset = {...state.right.targetOffset};
  } else {
    state.left.currentOffset = {x: 0, y: 0};
    state.right.currentOffset = {x: 0, y: 0};
  }

  return {
    left: state.left.currentOffset,
    right: state.right.currentOffset,
  };
}
