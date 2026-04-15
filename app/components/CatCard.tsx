"use client";

import type {CatsEyeSaveData} from "../types";
import {GalleryPreview} from "./GalleryPreview";

export function CatCard({
  data,
  label,
  sublabel,
}: {
  data: CatsEyeSaveData;
  label?: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        overflow: "hidden",
        backgroundColor: data.textureSettings.backgroundColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <GalleryPreview data={data} contentScale={0.85} />
      {label && (
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: data.textureSettings.backgroundColor,
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.4,
              color: "#fff",
              mixBlendMode: "difference",
            }}
          >
            {label}
          </p>
          {sublabel && (
            <p
              style={{
                fontSize: "11px",
                margin: 0,
                lineHeight: 1.4,
                color: "#fff",
                mixBlendMode: "difference",
                opacity: 0.7,
              }}
            >
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
