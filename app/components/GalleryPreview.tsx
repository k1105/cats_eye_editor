"use client";

import {useEffect, useRef, useState, useCallback} from "react";
import type p5Type from "p5";
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
const CANVAS_W = 400;
const CANVAS_H = 225;

export function GalleryPreview({data}: {data: CatsEyeSaveData}) {
  const furContainerRef = useRef<HTMLDivElement>(null);
  const eyeCanvasRef = useRef<HTMLDivElement>(null);
  const [furImageUrl, setFurImageUrl] = useState<string | null>(null);
  const furP5Ref = useRef<p5Type | null>(null);
  const eyeP5Ref = useRef<p5Type | null>(null);

  // Layer 1: Render fur once as static image
  useEffect(() => {
    if (!furContainerRef.current || furImageUrl) return;

    let cancelled = false;

    Promise.all([import("p5"), import("./FurDrawing")]).then(
      ([p5Module, furModule]) => {
        if (cancelled || !furContainerRef.current) return;

        const p5Constructor = p5Module.default;

        furP5Ref.current = new p5Constructor((p: p5Type) => {
          const scaleFactor = CANVAS_W / REFERENCE_W;

          const furState: import("./FurDrawing").FurDrawingState = {
            gridUsesBase: [],
            gridCustom: [],
            lastNumLines: 0,
            colorMap: null,
            colorMapInitialized: false,
            furLayer: null,
            needsRedraw: true,
            prevSettingsHash: "",
          };

          p.setup = () => {
            p.createCanvas(CANVAS_W, CANVAS_H);
            p.pixelDensity(1);
            p.colorMode(p.RGB);
            p.strokeCap(p.PROJECT);
          };

          p.draw = () => {
            p.noLoop();
            p.background(data.textureSettings.backgroundColor);

            p.push();
            p.scale(scaleFactor);

            const furDrawing = furModule.createFurDrawing(
              {
                p,
                textureSettings: data.textureSettings,
                drawSize: {width: REFERENCE_W, height: REFERENCE_H},
                activeMode: "eye",
                initialFurColor: furModule.INIT_FUR_COLOR,
              },
              furState
            );
            furDrawing.renderStaticFur();

            p.pop();

            // Capture as static image
            const canvas = (p.drawingContext as CanvasRenderingContext2D)
              .canvas;
            if (!cancelled) {
              setFurImageUrl(canvas.toDataURL("image/png"));
            }

            // Cleanup Graphics objects
            furState.furLayer?.remove();
            furState.colorMap?.remove();

            setTimeout(() => {
              furP5Ref.current?.remove();
              furP5Ref.current = null;
            }, 0);
          };
        }, furContainerRef.current) as p5Type;
      }
    );

    return () => {
      cancelled = true;
      furP5Ref.current?.remove();
      furP5Ref.current = null;
    };
  }, [data, furImageUrl]);

  // Layer 2: Real-time eye + nose rendering with pupil tracking
  const eyeDataRef = useRef(data);
  eyeDataRef.current = data;

  const startEyeCanvas = useCallback(
    (container: HTMLDivElement) => {
      let cancelled = false;

      import("p5").then((p5Module) => {
        if (cancelled || !container) return;

        const p5Constructor = p5Module.default;
        const pupilState: PupilTrackingState = createPupilTrackingState();

        eyeP5Ref.current = new p5Constructor((p: p5Type) => {
          const scaleFactor = CANVAS_W / REFERENCE_W;

          p.setup = () => {
            const canvas = p.createCanvas(CANVAS_W, CANVAS_H);
            p.pixelDensity(1);
            p.colorMode(p.RGB);
            // Transparent background, stretch to fill container
            const canvasEl = canvas.elt as HTMLCanvasElement;
            canvasEl.style.backgroundColor = "transparent";
            canvasEl.style.width = "100%";
            canvasEl.style.height = "100%";
          };

          p.draw = () => {
            const d = eyeDataRef.current;
            p.clear();

            p.push();
            p.scale(scaleFactor);

            // Mouse → reference coordinates (no margin in gallery)
            const referenceX = p.mouseX / scaleFactor;
            const referenceY = p.mouseY / scaleFactor;

            const centerX = REFERENCE_W / 2;
            const leftEyeX = centerX - d.eyeSpacing / 2;
            const rightEyeX = centerX + d.eyeSpacing / 2;

            // Pupil tracking
            const pupilOffsets = updatePupilOffsets(pupilState, {
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
              currentTimeMs: p.millis(),
              lerpFn: p.lerp,
            });

            // Draw eyes
            drawSingleEyePreview(
              p,
              d.eyeState,
              pupilOffsets.left,
              leftEyeX,
              0,
              true,
              d.eyeballColor,
              d.eyeballRadius,
              d.pupilWidthRatio
            );
            drawSingleEyePreview(
              p,
              d.eyeState,
              pupilOffsets.right,
              rightEyeX,
              0,
              false,
              d.eyeballColor,
              d.eyeballRadius,
              d.pupilWidthRatio
            );

            // Draw nose
            drawNose(p, d.noseSettings, {
              width: REFERENCE_W,
              height: REFERENCE_H,
            });

            p.pop();
          };
        }, container) as p5Type;
      });

      return () => {
        cancelled = true;
        eyeP5Ref.current?.remove();
        eyeP5Ref.current = null;
      };
    },
    [] // stable: uses refs for data
  );

  // Start/stop eye canvas when fur image is ready
  useEffect(() => {
    if (!furImageUrl || !eyeCanvasRef.current) return;
    return startEyeCanvas(eyeCanvasRef.current);
  }, [furImageUrl, startEyeCanvas]);

  // Before fur image is ready, show hidden offscreen container for fur rendering
  if (!furImageUrl) {
    return (
      <div
        ref={furContainerRef}
        style={{width: 0, height: 0, overflow: "hidden", position: "absolute"}}
      />
    );
  }

  // 2-layer display: static fur image + live eye overlay
  return (
    <div style={{position: "relative", width: "100%", aspectRatio: "16/9"}}>
      <img
        src={furImageUrl}
        alt="Cat fur"
        style={{width: "100%", height: "100%", display: "block"}}
      />
      <div
        ref={eyeCanvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
