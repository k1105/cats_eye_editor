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
  const [isWingsOpen, setIsWingsOpen] = useState(true);
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

  // 0.1秒周期で羽を開閉するアニメーション
  useEffect(() => {
    if (!isCircleActive) return;

    const interval = setInterval(() => {
      setIsWingsOpen((prev) => !prev);
    }, 100); // 0.1秒 = 100ms

    return () => clearInterval(interval);
  }, [isCircleActive]);

  // 進行方向に応じた回転角度を計算
  const getRotationAngle = (direction: CirclePath["direction"]): number => {
    switch (direction) {
      case "top":
        return 180; // 下向き
      case "right":
        return 270; // 左向き
      case "bottom":
        return 0; // 上向き
      case "left":
        return 90; // 右向き
      case "topLeft":
        return 135; // 右下向き
      case "topRight":
        return 225; // 左下向き
      case "bottomLeft":
        return 45; // 右上向き
      case "bottomRight":
        return 315; // 左上向き（-45度と同じ）
      default:
        return 0;
    }
  };

  return (
    <main style={{position: "relative", overflow: "hidden"}}>
      <UnifiedEditor
        circlePosition={circlePosition}
        isCircleActive={isCircleActive}
      />
      {circlePosition && circlePath && (
        <div
          style={{
            position: "fixed",
            left: `${circlePosition.x}px`,
            top: `${circlePosition.y}px`,
            transform: "translate(-25px, -25px)",
            pointerEvents: "none",
            zIndex: 9999,
            willChange: "transform",
            width: "50px",
            height: "50px",
          }}
        >
          {/* ドロップシャドウ（回転させない、右下に固定） */}
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
          {/* 画像（回転させる） */}
          <img
            src={isWingsOpen ? "/ladybug.svg" : "/ladybug-close.svg"}
            alt="Ladybug"
            style={{
              position: "relative",
              width: "30px",
              height: "30px",
              transform: `rotate(${getRotationAngle(circlePath.direction)}deg)`,
            }}
          />
        </div>
      )}
    </main>
  );
}
