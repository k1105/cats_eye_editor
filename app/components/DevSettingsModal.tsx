"use client";

import React from "react";
import type {EdgeFurSettings} from "../types";

interface DevSettingsModalProps {
  onExport: () => void;
  onImport: () => void;
  onClose: () => void;
  edgeFurSettings: EdgeFurSettings;
  onEdgeFurSettingsChange: (settings: EdgeFurSettings) => void;
  faceDisplayScale: number;
  onFaceDisplayScaleChange: (scale: number) => void;
  faceMaxHeightScale: number;
  onFaceMaxHeightScaleChange: (scale: number) => void;
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
  onExport,
  onImport,
  onClose,
  edgeFurSettings,
  onEdgeFurSettingsChange,
  faceDisplayScale,
  onFaceDisplayScaleChange,
  faceMaxHeightScale,
  onFaceMaxHeightScaleChange,
}) => {
  const handleClose = onClose;

  const updateEdgeFur = (patch: Partial<EdgeFurSettings>) => {
    onEdgeFurSettingsChange({...edgeFurSettings, ...patch});
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "340px",
        maxWidth: "90%",
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        borderLeft: "1px solid #e5e7eb",
        padding: "24px",
        overflowY: "auto",
        zIndex: 1000,
        boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.08)",
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

        {/* Face Display Scale */}
        <div style={{marginBottom: "16px"}}>
          <div style={sliderLabelStyle}>
            <span>顔の表示幅（画面幅比）</span>
            <span>{faceDisplayScale}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={200}
            step={1}
            value={faceDisplayScale}
            onChange={(e) => onFaceDisplayScaleChange(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        {/* Face Max Height Scale */}
        <div style={{marginBottom: "16px"}}>
          <div style={sliderLabelStyle}>
            <span>顔の最大高さ（画面高さ比）</span>
            <span>{faceMaxHeightScale}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={200}
            step={1}
            value={faceMaxHeightScale}
            onChange={(e) => onFaceMaxHeightScaleChange(Number(e.target.value))}
            style={sliderStyle}
          />
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
  );
};
