"use client";

import type {CatsEyeSaveData} from "../types";
import {GalleryPreview} from "./GalleryPreview";

export function CatCard({
  data,
  label,
  sublabel,
  contentScale = 1,
}: {
  data: CatsEyeSaveData;
  label?: string;
  sublabel?: string;
  contentScale?: number;
}) {
  return (
    <div
      style={{
        overflow: "hidden",
        backgroundColor: data.textureSettings.backgroundColor,
        position: "relative",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            transform: `scale(${contentScale})`,
          }}
        >
          <GalleryPreview data={data} />
        </div>
      </div>
      {label && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "10px 12px",
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
