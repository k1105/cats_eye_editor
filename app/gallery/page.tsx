"use client";

import {GalleryPreview} from "../components/GalleryPreview";
import {galleryItems} from "./galleryData";

export default function GalleryPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridAutoRows: "calc(100vw / 3 * 9 / 16)",
        lineHeight: 0,
      }}
    >
      {galleryItems.map((data, i) => (
        <div
          key={i}
          style={{
            overflow: "hidden",
            backgroundColor: data.textureSettings.backgroundColor,
          }}
        >
          <GalleryPreview data={data} />
        </div>
      ))}
    </main>
  );
}
