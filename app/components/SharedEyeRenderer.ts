"use client";

import type p5Type from "p5";
import type {MutableRefObject} from "react";
import type {CatsEyeSaveData} from "../types";
import {
  createPupilTrackingState,
  updatePupilOffsets,
  type PupilTrackingState,
} from "./PupilTracking";
import {drawSingleEyePreview} from "./CatFaceRenderer";
import {drawNose} from "./EyeDrawing";

const REFERENCE_W = 800;
const REFERENCE_H = 450;
const CANVAS_W = 800;
const CANVAS_H = 450;
const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export interface EyeCardRegistration {
  canvas: HTMLCanvasElement;
  contentScale: number;
  isMobileRef: MutableRefObject<boolean>;
  getData: () => CatsEyeSaveData;
  getContainerRect: () => DOMRect;
  ladybugPosRef: MutableRefObject<{x: number; y: number} | null>;
  onFirstDraw?: () => void;
}

interface InternalReg extends EyeCardRegistration {
  id: number;
  pupilState: PupilTrackingState;
  smoothX: number;
  smoothY: number;
  firstDrawDone: boolean;
}

class SharedEyeManager {
  private registry = new Map<number, InternalReg>();
  private nextId = 0;
  private rafId: number | null = null;
  private lastFrameMs = 0;
  private p5Instance: p5Type | null = null;
  private graphics: p5Type.Graphics | null = null;
  private initPromise: Promise<void> | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private mouseMoveAttached = false;

  private ensureInit(): Promise<void> {
    if (this.graphics) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const p5Module = await import("p5");
      const P5 = p5Module.default;

      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.left = "-9999px";
      host.style.top = "-9999px";
      host.style.width = "1px";
      host.style.height = "1px";
      host.style.overflow = "hidden";
      host.style.pointerEvents = "none";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);

      await new Promise<void>((resolve) => {
        this.p5Instance = new P5((p: p5Type) => {
          p.setup = () => {
            p.createCanvas(1, 1);
            p.noLoop();
            const g = p.createGraphics(REFERENCE_W, REFERENCE_H);
            g.pixelDensity(1);
            g.colorMode(p.RGB);
            this.graphics = g;
            resolve();
          };
        }, host) as p5Type;
      });
    })();

    return this.initPromise;
  }

  private attachMouseListener() {
    if (this.mouseMoveAttached) return;
    this.mouseMoveAttached = true;
    document.addEventListener(
      "mousemove",
      (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      },
      {passive: true},
    );
  }

  async register(reg: EyeCardRegistration): Promise<() => void> {
    await this.ensureInit();
    this.attachMouseListener();

    const id = ++this.nextId;
    const internal: InternalReg = {
      ...reg,
      id,
      pupilState: createPupilTrackingState(),
      smoothX: CANVAS_W / 2,
      smoothY: CANVAS_H / 2,
      firstDrawDone: false,
    };
    this.registry.set(id, internal);
    this.startLoop();

    return () => {
      this.registry.delete(id);
      if (this.registry.size === 0) this.stopLoop();
    };
  }

  private startLoop() {
    if (this.rafId !== null) return;
    this.lastFrameMs = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (now: number) => {
    this.rafId = requestAnimationFrame(this.tick);
    const elapsed = now - this.lastFrameMs;
    if (elapsed < FRAME_INTERVAL_MS) return;
    this.lastFrameMs = now - (elapsed % FRAME_INTERVAL_MS);

    if (!this.graphics) return;
    for (const reg of this.registry.values()) {
      this.drawOne(reg, now);
    }
  };

  private drawOne(reg: InternalReg, currentTimeMs: number) {
    const g = this.graphics;
    if (!g) return;

    const d = reg.getData();
    const isMobile = reg.isMobileRef.current;
    const contentScale = reg.contentScale;
    const scaleFactor = CANVAS_W / REFERENCE_W;
    const totalScale = scaleFactor * contentScale;
    const offsetX = (CANVAS_W * (1 - contentScale)) / 2;
    const offsetY = (CANVAS_H * (1 - contentScale)) / 2;

    // Determine tracking target (canvas-space coords)
    let trackX: number;
    let trackY: number;

    if (isMobile) {
      let targetX = CANVAS_W / 2;
      let targetY = CANVAS_H / 2;
      const lpos = reg.ladybugPosRef.current;
      if (lpos) {
        const rect = reg.getContainerRect();
        if (rect.width > 0 && rect.height > 0) {
          targetX = ((lpos.x - rect.left) / rect.width) * CANVAS_W;
          targetY = ((lpos.y - rect.top) / rect.height) * CANVAS_H;
        }
      }
      reg.smoothX = reg.smoothX + (targetX - reg.smoothX) * 0.06;
      reg.smoothY = reg.smoothY + (targetY - reg.smoothY) * 0.06;
      trackX = reg.smoothX;
      trackY = reg.smoothY;
    } else {
      const rect = reg.getContainerRect();
      if (rect.width > 0 && rect.height > 0) {
        trackX = ((this.mouseX - rect.left) / rect.width) * CANVAS_W;
        trackY = ((this.mouseY - rect.top) / rect.height) * CANVAS_H;
      } else {
        trackX = CANVAS_W / 2;
        trackY = CANVAS_H / 2;
      }
    }

    const referenceX = (trackX - offsetX) / totalScale;
    const referenceY = (trackY - offsetY) / totalScale;

    const centerX = REFERENCE_W / 2;
    const leftEyeX = centerX - d.eyeSpacing / 2;
    const rightEyeX = centerX + d.eyeSpacing / 2;

    const lerpFn = (a: number, b: number, t: number) => a + (b - a) * t;

    const pupilOffsets = updatePupilOffsets(reg.pupilState, {
      targetPos: {x: referenceX, y: referenceY},
      leftEyeCenterX: leftEyeX,
      rightEyeCenterX: rightEyeX,
      irisX: d.eyeState.iris.x,
      irisY: d.eyeState.iris.y,
      eyeSpacing: d.eyeSpacing,
      eyeballRadius: d.eyeballRadius,
      l_irisConstraint: d.l_irisConstraint,
      irisWidth: d.eyeState.iris.w,
      isPupilTracking: true,
      currentTimeMs,
      lerpFn,
    });

    // Clear graphics & draw eyes + nose
    g.clear();
    g.push();
    g.translate(offsetX, offsetY);
    g.scale(totalScale);

    const gAsP5 = g as unknown as p5Type;
    drawSingleEyePreview(
      gAsP5,
      d.eyeState,
      pupilOffsets.left,
      leftEyeX,
      0,
      true,
      d.eyeballColor,
      d.eyeballRadius,
      d.pupilWidthRatio,
    );
    drawSingleEyePreview(
      gAsP5,
      d.eyeState,
      pupilOffsets.right,
      rightEyeX,
      0,
      false,
      d.eyeballColor,
      d.eyeballRadius,
      d.pupilWidthRatio,
    );

    drawNose(gAsP5, d.noseSettings, {width: REFERENCE_W, height: REFERENCE_H});

    g.pop();

    // Copy graphics canvas to the card's display canvas
    const srcCanvas = (g as unknown as {canvas: HTMLCanvasElement}).canvas;
    const ctx = reg.canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, reg.canvas.width, reg.canvas.height);
      ctx.drawImage(srcCanvas, 0, 0, reg.canvas.width, reg.canvas.height);
    }

    if (!reg.firstDrawDone) {
      reg.firstDrawDone = true;
      reg.onFirstDraw?.();
    }
  }
}

export const sharedEyeManager = new SharedEyeManager();

export const SHARED_EYE_CANVAS_W = CANVAS_W;
export const SHARED_EYE_CANVAS_H = CANVAS_H;
