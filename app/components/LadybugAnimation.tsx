"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type Direction =
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
  key: number;
}

interface LadybugContextValue {
  position: {x: number; y: number} | null;
  isActive: boolean;
  direction: Direction | null;
}

const LadybugContext = createContext<LadybugContextValue>({
  position: null,
  isActive: false,
  direction: null,
});

export function useLadybug() {
  return useContext(LadybugContext);
}

// 後方互換のため残しておく型（他所でimportされている可能性があるため）
export interface LadybugUpdateDetail {
  position: {x: number; y: number} | null;
  isActive: boolean;
}

export function LadybugProvider({children}: {children: ReactNode}) {
  const [circlePath, setCirclePath] = useState<CirclePath | null>(null);
  const [position, setPosition] = useState<{x: number; y: number} | null>(
    null,
  );
  const [isActive, setIsActive] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const generateNewPath = () => {
      const directions: Direction[] = [
        "top",
        "right",
        "bottom",
        "left",
        "topLeft",
        "topRight",
        "bottomLeft",
        "bottomRight",
      ];
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      const startPercent = Math.random() * 100;
      const endPercent = Math.random() * 100;

      setCirclePath({
        direction,
        startPercent,
        endPercent,
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

  useEffect(() => {
    if (!circlePath) return;

    const radius = 30;
    const duration = 9000;
    const startTime = Date.now();
    setIsActive(true);

    const calculatePosition = (
      direction: Direction,
      startPercent: number,
      endPercent: number,
      progress: number,
    ): {x: number; y: number} => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const radiusPx = radius;

      switch (direction) {
        case "top": {
          const startX = (vw * startPercent) / 100;
          const y = -radiusPx + (vh + radiusPx * 2) * progress;
          return {x: startX, y};
        }
        case "right": {
          const startY = (vh * startPercent) / 100;
          const x = vw + radiusPx - (vw + radiusPx * 2) * progress;
          return {x, y: startY};
        }
        case "bottom": {
          const startX = (vw * startPercent) / 100;
          const y = vh + radiusPx - (vh + radiusPx * 2) * progress;
          return {x: startX, y};
        }
        case "left": {
          const startY = (vh * startPercent) / 100;
          const x = -radiusPx + (vw + radiusPx * 2) * progress;
          return {x, y: startY};
        }
        case "topLeft": {
          const startX = (vw * startPercent) / 100;
          const endX = (vw * endPercent) / 100;
          const x = startX + (endX - startX + vw + radiusPx * 2) * progress;
          const y = -radiusPx + (vh + radiusPx * 2) * progress;
          return {x, y};
        }
        case "topRight": {
          const startX = vw - (vw * startPercent) / 100;
          const endX = vw - (vw * endPercent) / 100;
          const x = startX - (startX - endX + vw + radiusPx * 2) * progress;
          const y = -radiusPx + (vh + radiusPx * 2) * progress;
          return {x, y};
        }
        case "bottomLeft": {
          const startX = (vw * startPercent) / 100;
          const endX = (vw * endPercent) / 100;
          const x = startX + (endX - startX + vw + radiusPx * 2) * progress;
          const y = vh + radiusPx - (vh + radiusPx * 2) * progress;
          return {x, y};
        }
        case "bottomRight": {
          const startX = vw - (vw * startPercent) / 100;
          const endX = vw - (vw * endPercent) / 100;
          const x = startX - (startX - endX + vw + radiusPx * 2) * progress;
          const y = vh + radiusPx - (vh + radiusPx * 2) * progress;
          return {x, y};
        }
      }
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const pos = calculatePosition(
          circlePath.direction,
          circlePath.startPercent,
          circlePath.endPercent ?? 50,
          progress,
        );
        setPosition(pos);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsActive(false);
        setPosition(null);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [circlePath]);

  return (
    <LadybugContext.Provider
      value={{
        position,
        isActive,
        direction: circlePath?.direction ?? null,
      }}
    >
      {children}
    </LadybugContext.Provider>
  );
}

export function LadybugAnimation() {
  const {position, isActive, direction} = useLadybug();
  const [isWingsOpen, setIsWingsOpen] = useState(true);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setIsWingsOpen((prev) => !prev);
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const getRotationAngle = (dir: Direction): number => {
    switch (dir) {
      case "top":
        return 180;
      case "right":
        return 270;
      case "bottom":
        return 0;
      case "left":
        return 90;
      case "topLeft":
        return 135;
      case "topRight":
        return 225;
      case "bottomLeft":
        return 45;
      case "bottomRight":
        return 315;
      default:
        return 0;
    }
  };

  if (!position || !direction) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-25px, -25px)",
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
        src={isWingsOpen ? "/ladybug.svg" : "/ladybug-close.svg"}
        alt="Ladybug"
        style={{
          position: "relative",
          width: "30px",
          height: "30px",
          transform: `rotate(${getRotationAngle(direction)}deg)`,
        }}
      />
    </div>
  );
}
