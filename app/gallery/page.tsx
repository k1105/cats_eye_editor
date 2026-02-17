"use client";

import {GalleryPreview} from "../components/GalleryPreview";
import {galleryItems} from "./galleryData";

export default function GalleryPage() {
  return (
    <main style={{padding: "40px 24px", maxWidth: "960px", margin: "0 auto"}}>
      <h1>Gallery</h1>
      <div
        className="grid-gallery"
        style={{
          gap: "16px",
          marginTop: "24px",
        }}
      >
        {galleryItems.map((data, i) => (
          <div
            key={i}
            style={{
              borderRadius: 0,
              overflow: "hidden",
              backgroundColor: data.textureSettings.backgroundColor,
              aspectRatio: "16/9",
            }}
          >
            <GalleryPreview data={data} />
          </div>
        ))}
      </div>
    </main>
  );
}
