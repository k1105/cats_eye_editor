"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

export type Direction =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

interface CirclePath {
  direction: Direction;
  startPercent: number;
  endPercent?: number;
  curveSign: 1 | -1;
  key: number;
}

interface LadybugContextValue {
  circlePath: CirclePath | null;
  /** アニメーション中かどうか（infrequent変化 → state OK） */
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
  direction: Direction | null;
  /** 現在位置。rAFから直接書き換えられる（React state ではない） */
  positionRef: MutableRefObject<{x: number; y: number} | null>;
}

// 後方互換のため残しておく型
export interface LadybugUpdateDetail {
  position: {x: number; y: number} | null;
  isActive: boolean;
}

const _fallbackRef: MutableRefObject<{x: number; y: number} | null> = {current: null};

const LadybugContext = createContext<LadybugContextValue>({
  circlePath: null,
  isActive: false,
  setIsActive: () => {},
  direction: null,
  positionRef: _fallbackRef,
});

export function useLadybug() {
  return useContext(LadybugContext);
}

export function LadybugProvider({children}: {children: ReactNode}) {
  const [circlePath, setCirclePath] = useState<CirclePath | null>(null);
  const [isActive, setIsActive] = useState(false);
  const positionRef = useRef<{x: number; y: number} | null>(null);

  useEffect(() => {
    const generateNewPath = () => {
      const directions: Direction[] = [
        "top", "right", "bottom", "left",
        "topLeft", "topRight", "bottomLeft", "bottomRight",
      ];
      setCirclePath({
        direction: directions[Math.floor(Math.random() * directions.length)],
        startPercent: Math.random() * 100,
        endPercent: Math.random() * 100,
        curveSign: Math.random() < 0.5 ? -1 : 1,
        key: Date.now(),
      });
    };

    const initialTimeout = setTimeout(generateNewPath, 10000);
    const interval = setInterval(generateNewPath, 30000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <LadybugContext.Provider
      value={{circlePath, isActive, setIsActive, direction: circlePath?.direction ?? null, positionRef}}
    >
      {children}
    </LadybugContext.Provider>
  );
}

const calcLinearPos = (
  direction: Direction,
  startPercent: number,
  endPercent: number,
  progress: number,
  radius: number,
): {x: number; y: number} => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = radius;
  switch (direction) {
    case "top":    return {x: (vw * startPercent) / 100, y: -r + (vh + r * 2) * progress};
    case "right":  return {x: vw + r - (vw + r * 2) * progress, y: (vh * startPercent) / 100};
    case "bottom": return {x: (vw * startPercent) / 100, y: vh + r - (vh + r * 2) * progress};
    case "left":   return {x: -r + (vw + r * 2) * progress, y: (vh * startPercent) / 100};
    case "topLeft": {
      const sx = (vw * startPercent) / 100, ex = (vw * endPercent) / 100;
      return {x: sx + (ex - sx + vw + r * 2) * progress, y: -r + (vh + r * 2) * progress};
    }
    case "topRight": {
      const sx = vw - (vw * startPercent) / 100, ex = vw - (vw * endPercent) / 100;
      return {x: sx - (sx - ex + vw + r * 2) * progress, y: -r + (vh + r * 2) * progress};
    }
    case "bottomLeft": {
      const sx = (vw * startPercent) / 100, ex = (vw * endPercent) / 100;
      return {x: sx + (ex - sx + vw + r * 2) * progress, y: vh + r - (vh + r * 2) * progress};
    }
    case "bottomRight": {
      const sx = vw - (vw * startPercent) / 100, ex = vw - (vw * endPercent) / 100;
      return {x: sx - (sx - ex + vw + r * 2) * progress, y: vh + r - (vh + r * 2) * progress};
    }
  }
};

export function LadybugAnimation() {
  const {circlePath, positionRef, setIsActive} = useLadybug();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!circlePath || !wrapperRef.current || !imgRef.current) return;

    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    const RADIUS = 30;
    const DURATION = 9000;
    const startTime = performance.now();

    const p0 = calcLinearPos(circlePath.direction, circlePath.startPercent, circlePath.endPercent ?? 50, 0, RADIUS);
    const p1 = calcLinearPos(circlePath.direction, circlePath.startPercent, circlePath.endPercent ?? 50, 1, RADIUS);
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    const perpX = len > 0 ? -dy / len : 0;
    const perpY = len > 0 ? dx / len : 0;
    const amplitude = Math.min(len * 0.5, Math.min(window.innerWidth, window.innerHeight) * 0.35);
    const sign = circlePath.curveSign;

    wrapper.style.display = "block";
    setIsActive(true);

    let wingsOpen = true;
    const wingsInterval = setInterval(() => {
      wingsOpen = !wingsOpen;
      img.src = wingsOpen ? "/ladybug.svg" : "/ladybug-close.svg";
    }, 100);

    let rafId: number;
    let cancelled = false;

    const animate = (now: number) => {
      if (cancelled) return;
      const progress = Math.min((now - startTime) / DURATION, 1);

      if (progress < 1) {
        const linear = calcLinearPos(
          circlePath.direction,
          circlePath.startPercent,
          circlePath.endPercent ?? 50,
          progress,
          RADIUS,
        );
        const arcOffset = amplitude * Math.sin(progress * Math.PI) * sign;
        const x = linear.x + perpX * arcOffset;
        const y = linear.y + perpY * arcOffset;

        const arcDeriv = amplitude * Math.PI * Math.cos(progress * Math.PI) * sign;
        const tx = dx + perpX * arcDeriv;
        const ty = dy + perpY * arcDeriv;
        const rot = (((Math.atan2(tx, -ty) * 180) / Math.PI) % 360 + 360) % 360;

        positionRef.current = {x, y};
        wrapper.style.transform = `translate(${x - 25}px, ${y - 25}px)`;
        img.style.transform = `rotate(${rot}deg)`;

        rafId = requestAnimationFrame(animate);
      } else {
        positionRef.current = null;
        wrapper.style.display = "none";
        clearInterval(wingsInterval);
        setIsActive(false);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearInterval(wingsInterval);
      positionRef.current = null;
      wrapper.style.display = "none";
    };
  // positionRef と setIsActive は stable なので deps から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circlePath]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        display: "none",
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        width: "50px",
        height: "50px",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "30px",
          height: "30px",
          left: "10px",
          top: "10px",
          filter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: "50%",
        }}
      />
      <img
        ref={imgRef}
        src="/ladybug.svg"
        alt="Ladybug"
        style={{
          position: "relative",
          width: "30px",
          height: "30px",
        }}
      />
    </div>
  );
}
