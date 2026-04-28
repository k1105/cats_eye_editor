"use client";

import {useEffect, useState} from "react";
import {CatCard} from "./CatCard";
import {galleryFiles} from "../gallery/galleryData";
import type {CatsEyeSaveData} from "../types";

export function GalleryGrid({contentScale = 1.15}: {contentScale?: number}) {
  const [items, setItems] = useState<CatsEyeSaveData[]>([]);

  useEffect(() => {
    Promise.all(
      galleryFiles.map((file) =>
        fetch(`/cat_data/${file}`).then((res) => res.json()),
      ),
    ).then((data) => {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
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
