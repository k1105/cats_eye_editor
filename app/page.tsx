"use client";

import { UnifiedEditor } from "./components/UnifiedEditor";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full h-screen">
        <UnifiedEditor />
      </div>
    </main>
  );
}
