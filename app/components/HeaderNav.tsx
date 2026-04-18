"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState, useCallback, useEffect, useRef} from "react";

export function HeaderNav() {
  const pathname = usePathname();
  const isTop = pathname === "/";
  const [editMode, setEditMode] = useState(false);
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const toggleEdit = useCallback(() => {
    setEditMode((prev) => !prev);
    window.dispatchEvent(
      new CustomEvent("toggle-edit-mode", {detail: {editMode: !editMode}}),
    );
  }, [editMode]);

  // パネル側の ✕ ボタンから閉じるリクエストを受信
  useEffect(() => {
    const handler = () => {
      if (editMode) toggleEdit();
    };
    window.addEventListener("request-close-edit", handler);
    return () => window.removeEventListener("request-close-edit", handler);
  }, [editMode, toggleEdit]);

  // ヘッダーの実寸を --header-height として公開
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${el.offsetHeight}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 30vhスクロールでヘッダーを隠す
  useEffect(() => {
    const threshold = window.innerHeight * 0.3;
    const handleScroll = () => {
      setHidden(window.scrollY > threshold);
    };
    window.addEventListener("scroll", handleScroll, {passive: true});
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className="w-full flex items-center justify-between py-3 px-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "white",
        color: "black",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.3s ease",
      }}
    >
      <Link
        href="/"
        className="text-lg font-semibold"
        style={{textDecoration: "none", color: "inherit"}}
      >
        Neko Lab Tokyo
      </Link>
      <nav className="flex items-center gap-4">
        {isTop && (
          <button
            onClick={toggleEdit}
            className="hidden md:block text-sm font-medium"
            style={{
              textDecoration: "none",
              color: "inherit",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: editMode ? 1 : 0.5,
              transition: "opacity 0.2s",
            }}
          >
            EDIT
          </button>
        )}
        <Link
          href="/about"
          className="text-sm font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          ABOUT
        </Link>
        <Link
          href="/member"
          className="text-sm font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          MEMBER
        </Link>
        <Link
          href="/gallery"
          className="hidden md:block text-sm font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          GALLERY
        </Link>
      </nav>
    </header>
  );
}
