import React, {useState} from "react";

interface ColorChangeDialogProps {
  isOpen: boolean;
  currentColor: string;
  onClose: () => void;
  onConfirm: (newColor: string) => void;
}

export const ColorChangeDialog: React.FC<ColorChangeDialogProps> = ({
  isOpen,
  currentColor,
  onClose,
  onConfirm,
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedColor);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#f9cb9b",
          padding: "24px",
          borderRadius: "8px",
          border: "0.75px solid var(--border-color)",
          minWidth: "320px",
          maxWidth: "90vw",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--text-color)",
          }}
        >
          ブラシ色を変更
        </h3>

        <div style={{marginBottom: "16px"}}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "var(--text-color)",
            }}
          >
            現在の色
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "4px",
                border: "0.75px solid var(--border-color)",
                backgroundColor: currentColor,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "14px",
                color: "var(--text-color)",
              }}
            >
              {currentColor}
            </div>
          </div>

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "var(--text-color)",
            }}
          >
            新しい色を選択
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "4px",
                border: "0.75px solid var(--border-color)",
                backgroundColor: selectedColor,
                flexShrink: 0,
              }}
            />
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                border: "0.75px solid var(--border-color)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            />
          </div>
          <div
            style={{
              marginTop: "8px",
              fontFamily: "monospace",
              fontSize: "14px",
              color: "var(--text-color)",
            }}
          >
            {selectedColor}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#e0e0e0",
              border: "0.75px solid var(--border-color)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              color: "var(--text-color)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#d0d0d0";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#e0e0e0";
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              border: "0.75px solid var(--border-color)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              color: "white",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#45a049";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#4CAF50";
            }}
          >
            変更
          </button>
        </div>
      </div>
    </div>
  );
};
