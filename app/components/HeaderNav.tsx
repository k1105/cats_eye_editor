"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useState, useCallback, useEffect, useRef} from "react";

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleEditClick = useCallback(() => {
    if (isTop) {
      toggleEdit();
    } else {
      router.push("/?edit=1");
    }
  }, [isTop, toggleEdit, router]);

  // topページに ?edit=1 で到着したら自動でEDITパネルを開く
  useEffect(() => {
    if (!isTop) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") !== "1") return;
    setEditMode(true);
    // page側のリスナー登録より後に発火させるため次タスクへ委ねる
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("toggle-edit-mode", {detail: {editMode: true}}),
      );
      // クエリパラメータをURLから取り除く
      window.history.replaceState({}, "", "/");
    }, 0);
  }, [isTop]);

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
      className="site-header w-full flex items-center justify-between px-4 md:px-[calc(var(--grid-col)*1)]"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "var(--page-bg)",
        color: "black",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.3s ease",
      }}
    >
      <Link
        href="/"
        className="text-xl font-semibold"
        style={{textDecoration: "none", color: "inherit"}}
      >
        Neko Lab Tokyo
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/about"
          className="text-md font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          ABOUT
        </Link>
        <Link
          href="/member"
          className="text-md font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          MEMBER
        </Link>
        <Link
          href="/gallery"
          className="hidden md:block text-md font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          GALLERY
        </Link>
        <button
          onClick={handleEditClick}
          className="hidden md:block text-md font-medium"
          style={{
            textDecoration: "none",
            color: "#ec5a29",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s",
            marginLeft: "var(--grid-col)",
          }}
        >
          EDIT
        </button>
      </nav>
    </header>
  );
}
