"use client";

import {useState, useEffect, useRef} from "react";
import {useLadybug} from "./LadybugAnimation";

// Directions where the beginning of the message faces the ladybug
const BEGINNING_NEAR_BUG = new Set(["right", "topRight", "bottom", "bottomRight"]);

const MESSAGE = "Editing is available on desktop only.";
const OFFSET = 24;
const CHAR_SPACING = 10.5;
const MAX_DIST = OFFSET + (MESSAGE.length + 2) * CHAR_SPACING;

interface TrailPoint {
  x: number;
  y: number;
  dist: number;
}

function findPointAtDistance(
  trail: TrailPoint[],
  dist: number,
): {x: number; y: number} | null {
  if (trail.length === 0) return null;
  if (dist <= trail[0].dist) return {x: trail[0].x, y: trail[0].y};
  for (let i = 0; i < trail.length - 1; i++) {
    if (trail[i + 1].dist >= dist) {
      const segLen = trail[i + 1].dist - trail[i].dist;
      const t = segLen > 0 ? (dist - trail[i].dist) / segLen : 0;
      return {
        x: trail[i].x + (trail[i + 1].x - trail[i].x) * t,
        y: trail[i].y + (trail[i + 1].y - trail[i].y) * t,
      };
    }
  }
  return null;
}

export function LadybugTrailText() {
  const {positionRef, isActive, direction} = useLadybug();
  const [isMobile, setIsMobile] = useState(false);
  const [, setTick] = useState(0);
  const trailRef = useRef<TrailPoint[]>([]);
  const isDrainingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // trail 蓄積: isActive 中は rAF で positionRef を読む
  useEffect(() => {
    if (!isActive) return;

    // 新しいアニメーション開始時にドレインをキャンセル
    if (isDrainingRef.current) {
      isDrainingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      trailRef.current = [];
    }

    let rafId: number;

    const tick = () => {
      const pos = positionRef.current;
      if (pos) {
        const trail = trailRef.current;
        if (trail.length === 0) {
          trail.push({x: pos.x, y: pos.y, dist: 0});
        } else {
          const head = trail[0];
          const seg = Math.hypot(pos.x - head.x, pos.y - head.y);
          if (seg > 0.5) {
            for (const p of trail) p.dist += seg;
            trail.unshift({x: pos.x, y: pos.y, dist: 0});
            while (trail.length > 2 && trail[trail.length - 1].dist > MAX_DIST) {
              trail.pop();
            }
            setTick((n) => n + 1);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    rafRef.current = rafId;

    return () => {
      cancelAnimationFrame(rafId);
      rafRef.current = null;
    };
  // positionRef は stable な ref なので deps 不要
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // drain: isActive が false になったとき
  useEffect(() => {
    if (isActive) return;

    const trail = trailRef.current;
    if (trail.length < 2 || isDrainingRef.current) {
      if (!isDrainingRef.current) {
        trailRef.current = [];
        setTick((n) => n + 1);
      }
      return;
    }

    isDrainingRef.current = true;
    const dx = trail[0].x - trail[1].x;
    const dy = trail[0].y - trail[1].y;
    const len = Math.hypot(dx, dy);
    const ux = len > 0 ? dx / len : 1;
    const uy = len > 0 ? dy / len : 0;
    const step = 2;

    const drain = () => {
      const t = trailRef.current;
      const head = t[0];
      const newHead = {x: head.x + ux * step, y: head.y + uy * step, dist: 0};
      for (const p of t) p.dist += step;
      t.unshift(newHead);
      while (t.length > 2 && t[t.length - 1].dist > MAX_DIST) t.pop();

      setTick((n) => n + 1);

      const lastCharDist = OFFSET + (MESSAGE.length - 1) * CHAR_SPACING;
      const lastPt = findPointAtDistance(t, lastCharDist);
      const margin = 60;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offScreen =
        !lastPt ||
        lastPt.x < -margin ||
        lastPt.x > vw + margin ||
        lastPt.y < -margin ||
        lastPt.y > vh + margin;

      if (offScreen) {
        isDrainingRef.current = false;
        trailRef.current = [];
        setTick((n) => n + 1);
        return;
      }

      rafRef.current = requestAnimationFrame(drain);
    };

    rafRef.current = requestAnimationFrame(drain);
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const trail = trailRef.current;
  if (!isMobile || trail.length < 2) return null;

  const reversed = direction !== null && !BEGINNING_NEAR_BUG.has(direction);
  const chars = MESSAGE.split("");
  const charPos = chars.map((_, i) => {
    const distIndex = reversed ? chars.length - 1 - i : i;
    return findPointAtDistance(trail, OFFSET + distIndex * CHAR_SPACING);
  });

  return (
    <>
      {chars.map((c, i) => {
        const p = charPos[i];
        if (!p) return null;
        return (
          <span
            key={i}
            style={{
              position: "fixed",
              left: `${p.x}px`,
              top: `${p.y}px`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 9998,
              fontSize: "12px",
              color: "#fff",
              mixBlendMode: "difference",
              whiteSpace: "pre",
              fontFamily: "inherit",
              lineHeight: 1,
            }}
          >
            {c === " " ? "\u00a0" : c}
          </span>
        );
      })}
    </>
  );
}
