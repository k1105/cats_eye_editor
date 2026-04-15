"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState, useCallback} from "react";

export function HeaderNav() {
  const pathname = usePathname();
  const isTop = pathname === "/";
  const [editMode, setEditMode] = useState(false);

  const toggleEdit = useCallback(() => {
    setEditMode((prev) => !prev);
    window.dispatchEvent(
      new CustomEvent("toggle-edit-mode", {detail: {editMode: !editMode}}),
    );
  }, [editMode]);

  return (
    <header
      className="w-full flex items-center justify-between py-3 px-4"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        mixBlendMode: "difference",
        color: "white",
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
            className="text-sm font-medium"
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
          className="text-sm font-medium"
          style={{textDecoration: "none", color: "inherit"}}
        >
          GALLERY
        </Link>
      </nav>
    </header>
  );
}
