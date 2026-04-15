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

  // 30vhスクロールでヘッダーを隠す
  useEffect(() => {
    const threshold = window.innerHeight * 0.3;

    const handleScroll = () => {
      setHidden(window.scrollY > threshold);
    };

    // overflow:autoな要素内のスクロールも監視
    const handleElementScroll = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLElement) {
        setHidden(target.scrollTop > threshold);
      }
    };

    window.addEventListener("scroll", handleScroll, {passive: true});

    // DOM内のスクロール可能要素を探して監視
    const scrollables = document.querySelectorAll(".gallery-grid, [data-scrollable]");
    scrollables.forEach((el) => {
      el.addEventListener("scroll", handleElementScroll, {passive: true});
    });

    // DOMが変わる可能性があるのでMutationObserverで再バインド
    const observer = new MutationObserver(() => {
      const newScrollables = document.querySelectorAll(".gallery-grid, [data-scrollable]");
      newScrollables.forEach((el) => {
        el.removeEventListener("scroll", handleElementScroll);
        el.addEventListener("scroll", handleElementScroll, {passive: true});
      });
    });
    observer.observe(document.body, {childList: true, subtree: true});

    return () => {
      window.removeEventListener("scroll", handleScroll);
      scrollables.forEach((el) => {
        el.removeEventListener("scroll", handleElementScroll);
      });
      observer.disconnect();
    };
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
        mixBlendMode: "difference",
        color: "white",
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
