"use client";

import { useCallback, useEffect, useState } from "react";
import { CatCard } from "../components/CatCard";
import { loadMemberProfiles, type MemberProfile } from "./memberData";

// 知覚輝度 (ITU-R BT.601) から白黒を決める（ナビゲーションと同じロジック）
function contrastColor(bg: string): string {
  const h = bg.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
}

export default function MemberPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [readyIndices, setReadyIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadMemberProfiles().then(setProfiles);
  }, []);

  const handleReady = useCallback((i: number) => {
    setReadyIndices((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  // Profiles without catData never trigger onReady, so mark them ready up-front.
  useEffect(() => {
    profiles.forEach((m, i) => {
      if (!m.catData) handleReady(i);
    });
  }, [profiles, handleReady]);

  return (
    <main className="member-grid">
      {profiles.map((member, i) => {
        const hoverBg =
          member.catData?.textureSettings.backgroundColor ?? "#545454";
        return (
          <figure key={i} className="member-card">
            <div
              className={`member-card-preview${activeIndex === i ? " is-active" : ""}`}
              onClick={() => setActiveIndex((prev) => (prev === i ? null : i))}
            >
              {member.catData ? (
                <CatCard
                  data={member.catData}
                  contentScale={1.15}
                  onReady={() => handleReady(i)}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: "#545454",
                    width: "100%",
                    height: "100%",
                  }}
                />
              )}
              {member.comment && (
                <div
                  className="member-card-hover"
                  style={{
                    backgroundColor: hoverBg,
                    color: contrastColor(hoverBg),
                  }}
                >
                  <p className="member-card-hover-text">{member.comment}</p>
                </div>
              )}
            </div>
            <figcaption
              className={`member-card-caption${readyIndices.has(i) ? " is-ready" : ""}`}
            >
              <p className="member-name">
                {member.nameJa}　{member.nameEn}
              </p>
              {member.title && <p className="member-title">{member.title}</p>}
            </figcaption>
          </figure>
        );
      })}
    </main>
  );
}
