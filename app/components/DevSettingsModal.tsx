"use client";

import React from "react";
import type {EyeState, NoseSettings, EdgeFurSettings} from "../types";

interface DevSettingsModalProps {
  eyeState: EyeState;
  noseSettings: NoseSettings;
  eyeSpacing: number;
  eyeballRadius: number;
  k_anchorConstraint: number;
  onExport: () => void;
  onImport: () => void;
  onClose: () => void;
  edgeFurSettings: EdgeFurSettings;
  onEdgeFurSettingsChange: (settings: EdgeFurSettings) => void;
}

const sliderStyle: React.CSSProperties = {
  width: "100%",
  accentColor: "#666",
};

const sliderLabelStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "12px",
  color: "#555",
  marginBottom: "2px",
};

export const DevSettingsModal: React.FC<DevSettingsModalProps> = ({
  eyeState,
  noseSettings,
  eyeSpacing,
  eyeballRadius,
  k_anchorConstraint,
  onExport,
  onImport,
  onClose,
  edgeFurSettings,
  onEdgeFurSettingsChange,
}) => {
  const handleClose = onClose;

  const updateEdgeFur = (patch: Partial<EdgeFurSettings>) => {
    onEdgeFurSettingsChange({...edgeFurSettings, ...patch});
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

        {/* Edge Fur Settings */}
        <div style={{marginBottom: "16px"}}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#333",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => updateEdgeFur({enabled: !edgeFurSettings.enabled})}
            >
              エッジ毛並み処理
            </label>
            <button
              onClick={() => updateEdgeFur({enabled: !edgeFurSettings.enabled})}
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                border: "none",
                cursor: "pointer",
                backgroundColor: edgeFurSettings.enabled ? "#4ade80" : "#d1d5db",
                position: "relative",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: edgeFurSettings.enabled ? "20px" : "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>

          {edgeFurSettings.enabled && (
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div>
                <div style={sliderLabelStyle}>
                  <span>フェードアウト距離</span>
                  <span>{edgeFurSettings.falloffBase}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={1}
                  value={edgeFurSettings.falloffBase}
                  onChange={(e) => updateEdgeFur({falloffBase: Number(e.target.value)})}
                  style={sliderStyle}
                />
              </div>
              <div>
                <div style={sliderLabelStyle}>
                  <span>波の振幅</span>
                  <span>{edgeFurSettings.falloffWave}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={1}
                  value={edgeFurSettings.falloffWave}
                  onChange={(e) => updateEdgeFur({falloffWave: Number(e.target.value)})}
                  style={sliderStyle}
                />
              </div>
              <div>
                <div style={sliderLabelStyle}>
                  <span>波の粗さ</span>
                  <span>{edgeFurSettings.waveScale}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={400}
                  step={1}
                  value={edgeFurSettings.waveScale}
                  onChange={(e) => updateEdgeFur({waveScale: Number(e.target.value)})}
                  style={sliderStyle}
                />
              </div>
              <div>
                <div style={sliderLabelStyle}>
                  <span>角の丸み</span>
                  <span>{edgeFurSettings.cornerRadius}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  step={1}
                  value={edgeFurSettings.cornerRadius}
                  onChange={(e) => updateEdgeFur({cornerRadius: Number(e.target.value)})}
                  style={sliderStyle}
                />
              </div>
            </div>
          )}
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
