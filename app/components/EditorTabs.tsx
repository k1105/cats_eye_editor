"use client";

import React, { useState } from "react";
import { CatEyeEditor } from "./CatEyeEditor";
import { CatTextureEditor } from "./CatTextureEditor";
import type { EditorMode } from "../types";

export const EditorTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EditorMode>("eye");

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            <button
              onClick={() => setActiveTab("eye")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "eye"
                  ? "bg-yellow-400 text-yellow-900 shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              猫の目エディタ
            </button>
            <button
              onClick={() => setActiveTab("texture")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "texture"
                  ? "bg-yellow-400 text-yellow-900 shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              毛並みエディタ
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative">
          {/* 毛並みエディタ - 下層（常に表示） */}
          <div
            className={`${activeTab === "texture" ? "relative z-10" : "absolute inset-4 sm:inset-6 lg:inset-8 z-0 pointer-events-none opacity-50"}`}
          >
            <CatTextureEditor isActive={activeTab === "texture"} />
          </div>

          {/* 目エディタ - 上層（常に表示） */}
          <div
            className={`${activeTab === "eye" ? "relative z-10" : "absolute inset-4 sm:inset-6 lg:inset-8 z-0 pointer-events-none opacity-50"}`}
          >
            <CatEyeEditor isActive={activeTab === "eye"} />
          </div>
        </div>
      </div>
    </div>
  );
};
