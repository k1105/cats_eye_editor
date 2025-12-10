"use client";

import {UnifiedEditor} from "./components/UnifiedEditor";
import {useState, useEffect, useRef} from "react";

interface CirclePath {
  direction:
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight";
  startPercent: number;
  endPercent?: number;
  key: number;
}

export default function Home() {
  const [circlePath, setCirclePath] = useState<CirclePath | null>(null);
  const [circlePosition, setCirclePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isCircleActive, setIsCircleActive] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const generateNewPath = () => {
      const directions: Array<
        | "top"
        | "right"
        | "bottom"
        | "left"
        | "topLeft"
        | "topRight"
        | "bottomLeft"
        | "bottomRight"
      > = [
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

    // 初回実行
    generateNewPath();

    // 30秒ごとに新しい軌跡を生成（頻度を1/3に）
    const interval = setInterval(generateNewPath, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!circlePath) return;

    const radius = 30;
    const duration = 9000; // 9秒で通過（速度を1/3に）
    const startTime = Date.now();
    startTimeRef.current = startTime;
    setIsCircleActive(true);

    const calculatePosition = (
      direction: CirclePath["direction"],
      startPercent: number,
      endPercent: number,
      progress: number
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
        const position = calculatePosition(
          circlePath.direction,
          circlePath.startPercent,
          circlePath.endPercent ?? 50,
          progress
        );
        setCirclePosition(position);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsCircleActive(false);
        setCirclePosition(null);
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
    <main style={{position: "relative", overflow: "hidden"}}>
      <UnifiedEditor
        circlePosition={circlePosition}
        isCircleActive={isCircleActive}
      />
      {circlePosition && (
        <div
          style={{
            position: "fixed",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            pointerEvents: "none",
            zIndex: 9999,
            left: `${circlePosition.x}px`,
            top: `${circlePosition.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </main>
  );
}
