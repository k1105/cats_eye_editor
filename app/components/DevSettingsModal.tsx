"use client";

import React from "react";
import {useRouter} from "next/navigation";
import type {EyeState, NoseSettings} from "../types";

interface DevSettingsModalProps {
  eyeState: EyeState;
  noseSettings: NoseSettings;
  eyeSpacing: number;
  eyeballRadius: number;
  k_anchorConstraint: number;
  onExport: () => void;
  onImport: () => void;
}

export const DevSettingsModal: React.FC<DevSettingsModalProps> = ({
  eyeState,
  noseSettings,
  eyeSpacing,
  eyeballRadius,
  k_anchorConstraint,
  onExport,
  onImport,
}) => {
  const router = useRouter();

  const handleClose = () => {
    router.push("/");
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "480px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "16px",
            color: "#333",
          }}
        >
          開発者設定
        </h2>

        {/* Coordinate Display */}
        <div style={{marginBottom: "16px"}}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "8px",
              color: "#333",
            }}
          >
            現在の座標
          </label>
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "12px",
              fontSize: "12px",
              fontFamily: "monospace",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{color: "#333"}}>
              目頭: x={eyeState.innerCorner.x}, y={eyeState.innerCorner.y}
            </div>
            <div style={{color: "#333"}}>
              目尻: x={eyeState.outerCorner.x}, y={eyeState.outerCorner.y}
            </div>
            <div style={{color: "#333"}}>
              上まぶたCP1: x={eyeState.upperEyelid.cp1.x.toFixed(1)}, y=
              {eyeState.upperEyelid.cp1.y.toFixed(1)}
            </div>
            <div style={{color: "#333"}}>
              上まぶたCP2: x={eyeState.upperEyelid.cp2.x.toFixed(1)}, y=
              {eyeState.upperEyelid.cp2.y.toFixed(1)}
            </div>
            <div style={{color: "#333"}}>
              下まぶたCP1: x={eyeState.lowerEyelid.cp1.x.toFixed(1)}, y=
              {eyeState.lowerEyelid.cp1.y.toFixed(1)}
            </div>
            <div style={{color: "#333"}}>
              下まぶたCP2: x={eyeState.lowerEyelid.cp2.x.toFixed(1)}, y=
              {eyeState.lowerEyelid.cp2.y.toFixed(1)}
            </div>
            <div style={{color: "#333"}}>
              虹彩中心: x={eyeState.iris.x}, y={eyeState.iris.y}
            </div>
            <hr style={{borderColor: "#e5e7eb", margin: "4px 0"}} />
            <div style={{color: "#333"}}>
              眉間の間隔: {eyeSpacing.toFixed(1)}
            </div>
            <div style={{color: "#333"}}>
              目頭・目尻の円の半径: {(eyeballRadius * k_anchorConstraint).toFixed(1)}
              {" "}(k={k_anchorConstraint.toFixed(3)})
            </div>
            <div style={{color: "#333"}}>
              鼻の大きさ: {noseSettings.scale.toFixed(2)}
            </div>
            <div style={{color: "#333"}}>
              鼻のY位置: {noseSettings.y.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Export/Import buttons */}
        <div style={{display: "flex", gap: "12px"}}>
          <button
            onClick={onExport}
            style={{
              flex: 1,
              backgroundColor: "#e5e7eb",
              border: "1px solid #d1d5db",
              padding: "12px 16px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#333",
              fontSize: "14px",
            }}
          >
            エクスポート
          </button>
          <button
            onClick={onImport}
            style={{
              flex: 1,
              backgroundColor: "#e5e7eb",
              border: "1px solid #d1d5db",
              padding: "12px 16px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#333",
              fontSize: "14px",
            }}
          >
            インポート
          </button>
        </div>
      </div>
    </div>
  );
};
