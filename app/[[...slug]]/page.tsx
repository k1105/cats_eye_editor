"use client";

import {UnifiedEditor} from "../components/UnifiedEditor";
import {GalleryGrid} from "../components/GalleryGrid";
import {useState, useEffect} from "react";

export default function Home() {
  const [editMode, setEditMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // SP判定 (768px未満)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // HeaderNavからのeditModeトグルイベントを受信
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEditMode(detail.editMode);
    };
    window.addEventListener("toggle-edit-mode", handler);
    return () => window.removeEventListener("toggle-edit-mode", handler);
  }, []);

  // ?edit=1 で到着した場合はEDITパネルを開いた状態で初期化
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "1") {
      setEditMode(true);
    }
  }, []);

  if (isMobile) {
    return (
      <main>
        <GalleryGrid />
      </main>
    );
  }

  return (
    <main style={{position: "relative", overflow: "hidden"}}>
      <UnifiedEditor editMode={editMode} />
    </main>
  );
}
