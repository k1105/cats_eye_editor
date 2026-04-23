"use client";

import {useEffect, useState} from "react";
import {CatCard} from "../components/CatCard";
import {loadMemberProfiles, type MemberProfile} from "./memberData";

export default function MemberPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    loadMemberProfiles().then(setProfiles);
  }, []);

  return (
    <main className="member-grid">
      {profiles.map((member, i) => (
        <figure key={i} className="member-card">
          <div
            className={`member-card-preview${activeIndex === i ? " is-active" : ""}`}
            onClick={() =>
              setActiveIndex((prev) => (prev === i ? null : i))
            }
          >
            {member.catData ? (
              <CatCard data={member.catData} contentScale={1.15} />
            ) : (
              <div
                style={{backgroundColor: "#545454", width: "100%", height: "100%"}}
              />
            )}
            {member.comment && (
              <div
                className="member-card-hover"
                style={{
                  backgroundColor:
                    member.catData?.textureSettings.backgroundColor ??
                    "#545454",
                }}
              >
                <p className="member-card-hover-text">{member.comment}</p>
              </div>
            )}
          </div>
          <figcaption className="member-card-caption">
            <p className="member-name">
              {member.nameJa}　{member.nameEn}
            </p>
            {member.title && <p className="member-title">{member.title}</p>}
          </figcaption>
        </figure>
      ))}
    </main>
  );
}
