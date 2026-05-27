"use client";

import {useEffect, useRef, useState} from "react";
import type p5Type from "p5";
import {destroyP5, destroyGraphics} from "./p5Utils";
import type {CatsEyeSaveData} from "../types";
import {useLadybug} from "./LadybugAnimation";
import {
  sharedEyeManager,
  SHARED_EYE_CANVAS_W,
  SHARED_EYE_CANVAS_H,
} from "./SharedEyeRenderer";

const REFERENCE_W = 800;
const REFERENCE_H = 450;
const CANVAS_W = 800;
const CANVAS_H = 450;

// p5.js 2.0 は P2D でも filterRenderer として WebGL コンテキストを作成する。
// fur レンダーの同時実行を制限してコンテキスト数を抑える。
let _furActive = 0;
const _FUR_MAX = 2;
const _furWaiters: Array<() => void> = [];

// 大量カードが同時マウントしたときの初動スパイクを避けるため、
// fur 取得開始時刻を時間軸で間引く。
const FUR_STAGGER_MS = 80;
let _furNextAllowedAt = 0;

function acquireFur(): Promise<void> {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const startAt = Math.max(now, _furNextAllowedAt);
  _furNextAllowedAt = startAt + FUR_STAGGER_MS;
  const wait = startAt - now;
  const claimSlot = () =>
    new Promise<void>((resolve) => {
      if (_furActive < _FUR_MAX) {
        _furActive++;
        resolve();
      } else {
        _furWaiters.push(() => {
          _furActive++;
          resolve();
        });
      }
    });
  if (wait <= 0) return claimSlot();
  return new Promise<void>((resolve) => {
    setTimeout(() => claimSlot().then(resolve), wait);
  });
}

function releaseFur() {
  _furActive--;
  _furWaiters.shift()?.();
}

// Session cache: rendered fur image keyed by data object identity.
// Persists across in-session navigations (cleared on full page reload).
const furImageCache = new WeakMap<CatsEyeSaveData, string>();

export function GalleryPreview({
  data,
  contentScale = 1,
  onReady,
}: {
  data: CatsEyeSaveData;
  contentScale?: number;
  onReady?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const furContainerRef = useRef<HTMLDivElement>(null);
  const eyeCanvasRef = useRef<HTMLDivElement>(null);
  const cachedFurOnMount = furImageCache.get(data) ?? null;
  const [isVisible, setIsVisible] = useState(cachedFurOnMount !== null);
  const [isInView, setIsInView] = useState(false);
  const [furImageUrl, setFurImageUrl] = useState<string | null>(cachedFurOnMount);
  const [eyesReady, setEyesReady] = useState(false);
  const isMobileRef = useRef(false);
  const furP5Ref = useRef<p5Type | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onReadyFiredRef = useRef(false);
  // Stable accessor for the live data (avoids re-registering with the manager
  // on every render).
  const eyeDataRef = useRef(data);
  eyeDataRef.current = data;

  const {positionRef: ladybugPosRef} = useLadybug();

  useEffect(() => {
    if (furImageUrl && eyesReady && !onReadyFiredRef.current) {
      onReadyFiredRef.current = true;
      onReadyRef.current?.();
    }
  }, [furImageUrl, eyesReady]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    isMobileRef.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      isMobileRef.current = e.matches;
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver: detect when item enters viewport (+200px margin)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {rootMargin: "200px"},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Layer 1: Render fur once as static image
  useEffect(() => {
    if (!isVisible || !furContainerRef.current || furImageUrl) return;

    let cancelled = false;
    let slotAcquired = false;
    let slotReleased = false;

    const releaseSlot = () => {
      if (!slotReleased) { slotReleased = true; releaseFur(); }
    };

    acquireFur().then(() => {
      slotAcquired = true;
      if (cancelled) { releaseSlot(); return; }

      Promise.all([import("p5"), import("./FurDrawing")]).then(
        ([p5Module, furModule]) => {
          if (cancelled || !furContainerRef.current) { releaseSlot(); return; }

          const p5Constructor = p5Module.default;

          const colorMapReady = new Promise<HTMLImageElement | null>(
            (resolve) => {
              if (data.colorMapDataUrl) {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = data.colorMapDataUrl;
              } else {
                resolve(null);
              }
            },
          );

          colorMapReady.then((colorMapImg) => {
            if (cancelled || !furContainerRef.current) { releaseSlot(); return; }

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

                if (colorMapImg) {
                  const graphics = p.createGraphics(REFERENCE_W, REFERENCE_H);
                  graphics.pixelDensity(1);
                  graphics.colorMode(p.RGB);
                  graphics.noSmooth();
                  const canvas = (graphics as any).canvas as HTMLCanvasElement;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(colorMapImg, 0, 0, canvas.width, canvas.height);
                  }
                  furState.colorMap = graphics;
                  furState.colorMapInitialized = true;
                }
              };

              p.draw = () => {
                p.noLoop();
                p.background(data.textureSettings.backgroundColor);

                p.push();
                p.translate(
                  (CANVAS_W * (1 - contentScale)) / 2,
                  (CANVAS_H * (1 - contentScale)) / 2,
                );
                p.scale(scaleFactor * contentScale);

                const furDrawing = furModule.createFurDrawing(
                  {
                    p,
                    textureSettings: data.textureSettings,
                    drawSize: {width: REFERENCE_W, height: REFERENCE_H},
                    activeMode: "eye",
                    initialFurColor: furModule.INIT_FUR_COLOR,
                    edgeFurSettings: {
                      enabled: false,
                      falloffBase: 80,
                      falloffWave: 25,
                      waveScale: 120,
                      cornerRadius: 60,
                    },
                  },
                  furState,
                );
                furDrawing.renderStaticFur();

                p.pop();

                const canvas = (p.drawingContext as CanvasRenderingContext2D).canvas;
                if (!cancelled) {
                  const dataUrl = canvas.toDataURL("image/png");
                  furImageCache.set(data, dataUrl);
                  setFurImageUrl(dataUrl);
                }

                destroyGraphics(furState.furLayer);
                destroyGraphics(furState.colorMap);

                setTimeout(() => {
                  destroyP5(furP5Ref.current);
                  furP5Ref.current = null;
                  releaseSlot();
                }, 0);
              };
            }, furContainerRef.current) as p5Type;
          });
        },
      );
    });

    return () => {
      cancelled = true;
      if (slotAcquired) releaseSlot();
      destroyP5(furP5Ref.current);
      furP5Ref.current = null;
    };
  }, [data, furImageUrl, isVisible]);

  // viewport 出入りを監視して eye canvas を start/stop
  useEffect(() => {
    if (!furImageUrl) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      {rootMargin: "100px"},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [furImageUrl]);

  // Layer 2: register with the shared eye renderer (1 p5 + 1 RAF for the whole page)
  useEffect(() => {
    if (!furImageUrl || !isInView || !eyeCanvasRef.current) return;
    const container = eyeCanvasRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = SHARED_EYE_CANVAS_W;
    canvas.height = SHARED_EYE_CANVAS_H;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    let unregister: (() => void) | null = null;
    let cancelled = false;

    sharedEyeManager
      .register({
        canvas,
        contentScale,
        isMobileRef,
        getData: () => eyeDataRef.current,
        getContainerRect: () => container.getBoundingClientRect(),
        ladybugPosRef,
        onFirstDraw: () => {
          if (!cancelled) setEyesReady(true);
        },
      })
      .then((unreg) => {
        if (cancelled) {
          unreg();
          return;
        }
        unregister = unreg;
      });

    return () => {
      cancelled = true;
      unregister?.();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [furImageUrl, isInView, contentScale, ladybugPosRef]);

  // Placeholder before visible / fur ready
  if (!furImageUrl) {
    return (
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          aspectRatio: "16/9",
        }}
      >
        {isVisible && (
          <div
            ref={furContainerRef}
            style={{
              width: 0,
              height: 0,
              overflow: "hidden",
              position: "absolute",
            }}
          />
        )}
      </div>
    );
  }

  // 2-layer display: static fur image + live eye overlay
  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
      }}
    >
      <div
        className={`gallery-preview-face${eyesReady ? " gallery-preview-face-ready" : ""}`}
        style={{backgroundColor: data.textureSettings.backgroundColor}}
      >
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
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
