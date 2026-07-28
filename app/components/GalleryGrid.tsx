"use client";

import {useEffect, useState} from "react";
import {CatCard} from "./CatCard";
import {galleryFiles} from "../gallery/galleryData";
import {memberList} from "../member/memberData";
import type {CatsEyeSaveData} from "../types";

const memberFiles = memberList
  .map((m) => m.catFile)
  .filter((f): f is string => Boolean(f));
const allFiles = [...new Set([...galleryFiles, ...memberFiles])];

// Session cache: shuffled item list. Same order returned across in-session
// navigations so cards line up with their cached fur images.
let cachedShuffled: CatsEyeSaveData[] | null = null;

export function GalleryGrid({contentScale = 1.15}: {contentScale?: number}) {
  const [items, setItems] = useState<CatsEyeSaveData[]>(
    () => cachedShuffled ?? [],
  );

  useEffect(() => {
    if (cachedShuffled) return;
    Promise.all(
      allFiles.map((file) =>
        fetch(`/cat_data/${file}`).then((res) => res.json()),
      ),
    ).then((data) => {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      cachedShuffled = shuffled;
      setItems(shuffled);
    });
  }, []);

  return (
    <div className="gallery-grid">
      {items.map((data, i) => (
        <CatCard key={i} data={data} contentScale={contentScale} />
      ))}
    </div>
  );
}
