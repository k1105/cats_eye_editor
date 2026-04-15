"use client";

import {useEffect, useState} from "react";
import {CatCard} from "../components/CatCard";
import {loadMemberProfiles, type MemberProfile} from "./memberData";

export default function MemberPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);

  useEffect(() => {
    loadMemberProfiles().then(setProfiles);
  }, []);

  return (
    <main className="gallery-grid">
      {profiles.map((member, i) =>
        member.catData ? (
          <CatCard
            key={i}
            data={member.catData}
            label={`${member.nameJa}  ${member.nameEn}`}
            sublabel={member.title}
          />
        ) : (
          <div key={i} style={{backgroundColor: "#545454"}} />
        ),
      )}
    </main>
  );
}
