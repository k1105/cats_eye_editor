"use client";

import {useEffect, useState} from "react";
import {CatCard} from "../components/CatCard";
import {galleryFiles} from "./galleryData";
import type {CatsEyeSaveData} from "../types";

export default function GalleryPage() {
  const [items, setItems] = useState<CatsEyeSaveData[]>([]);

  useEffect(() => {
    Promise.all(
      galleryFiles.map((file) =>
        fetch(`/cat_data/${file}`).then((res) => res.json()),
      ),
    ).then((data) => setItems(data));
  }, []);

  return (
    <main className="gallery-grid">
      {items.map((data, i) => (
        <CatCard key={i} data={data} contentScale={1.15} />
      ))}
    </main>
  );
}
