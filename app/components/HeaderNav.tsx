"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useState, useCallback, useEffect, useRef} from "react";
import styles from "./HeaderNav.module.css";

const NAV_ITEMS = [
  {
    href: "/about",
    alt: "ABOUT",
    icon: "about",
    className: "inline-flex items-center",
  },
  {
    href: "/member",
    alt: "MEMBER",
    icon: "member",
    className: "inline-flex items-center",
  },
  {
    href: "/gallery",
    alt: "GALLERY",
    icon: "gallery",
    className: "hidden md:inline-flex items-center",
  },
] as const;

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
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("toggle-edit-mode", {detail: {editMode: true}}),
      );
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
    const handleScroll = () => setHidden(window.scrollY > threshold);
    window.addEventListener("scroll", handleScroll, {passive: true});
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className={`w-full flex items-center justify-between px-4 md:px-[calc(var(--grid-col)*1)] ${styles.header} ${hidden ? styles.hidden : ""}`}
    >
      <Link href="/" className={styles.logoLink}>
        <span aria-label="Neko Lab Tokyo" className={styles.logo} />
      </Link>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({href, alt, icon, className}) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${className}`}
            >
              <span
                aria-label={alt}
                className={`${styles.navIcon} ${styles[icon]}`}
              />
              {active && <span className={styles.underline} />}
            </Link>
          );
        })}

        <span className={`hidden md:block ${styles.separator}`} />

        <button
          onClick={handleEditClick}
          className={`hidden md:inline-flex items-center ${styles.editButton}`}
        >
          <span
            aria-label="EDIT"
            className={`${styles.navIcon} ${styles.edit}`}
          />
          {isTop && <span className={styles.underline} />}
        </button>
      </nav>
    </header>
  );
}
