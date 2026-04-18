"use client";

import {useEffect, useState} from "react";
import {ReactLenis} from "lenis/react";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    setEnabled(mql.matches);
    const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!enabled) return null;
  return <ReactLenis root />;
}
