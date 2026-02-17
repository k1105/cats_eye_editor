"use client";

import {GalleryPreview} from "../components/GalleryPreview";
import {memberProfiles} from "./memberData";

export default function MemberPage() {
  return (
    <main style={{padding: "40px 24px", maxWidth: "960px", margin: "0 auto"}}>
      <h1>Member</h1>
      <div
        className="grid-gallery"
        style={{
          gap: "32px 16px",
          marginTop: "24px",
        }}
      >
        {memberProfiles.map((member, i) => (
          <div key={i}>
            {/* Cat face thumbnail */}
            <div
              style={{
                borderRadius: 0,
                overflow: "hidden",
                backgroundColor:
                  member.catData.textureSettings.backgroundColor,
                aspectRatio: "16/9",
              }}
            >
              <GalleryPreview data={member.catData} />
            </div>
            {/* Profile info */}
            <div style={{marginTop: "12px"}}>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 2px",
                  lineHeight: 1.4,
                }}
              >
                {member.nameJa}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#888",
                    marginLeft: "8px",
                  }}
                >
                  {member.nameEn}
                </span>
              </p>
              {member.title && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {member.title}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
