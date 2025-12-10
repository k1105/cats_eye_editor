import type p5Type from "p5";
import type {TextureSettings} from "../types";

export interface FurDrawingState {
  gridUsesBase: boolean[][];
  gridCustom: string[][];
  lastNumLines: number;
}

export interface FurDrawingContext {
  p: p5Type;
  textureSettings: TextureSettings;
  drawSize: {width: number; height: number};
  activeMode: "eye" | "texture";
}

export const createFurDrawing = (
  context: FurDrawingContext,
  state: FurDrawingState
) => {
  const {p, drawSize, activeMode} = context;
  // textureSettingsは動的に参照するため、contextから取得する関数を作成
  const getTextureSettings = () => context.textureSettings;

  const calculateGridDimensions = (density: number) => {
    const drawHeight = drawSize.height;
    const drawWidth = drawSize.width;
    const gridSpacing = (drawHeight - 1) / (density - 1);
    const numCols = Math.floor((drawWidth - 1) / gridSpacing) + 1;
    return {rows: density, cols: numCols, spacing: gridSpacing};
  };

  const ensureGridSize = (numLines: number) => {
    if (numLines === state.lastNumLines && state.gridUsesBase.length) return;

    const {rows, cols} = calculateGridDimensions(numLines);

    state.gridUsesBase = Array.from({length: cols}, () =>
      Array.from({length: rows}, () => true)
    );

    state.gridCustom = Array.from({length: cols}, () =>
      Array.from({length: rows}, () => getTextureSettings().brushColor)
    );

    state.lastNumLines = numLines;
  };

  const paintAt = (
    x: number,
    y: number,
    r: number,
    penColor: string,
    numLines: number
  ) => {
    const {rows, cols, spacing} = calculateGridDimensions(numLines);

    const iMin = p.constrain(p.floor((x - r) / spacing), 0, cols - 1);
    const iMax = p.constrain(p.floor((x + r) / spacing), 0, cols - 1);
    const jMin = p.constrain(p.floor((y - r) / spacing), 0, rows - 1);
    const jMax = p.constrain(p.floor((y + r) / spacing), 0, rows - 1);

    for (let i = iMin; i <= iMax; i++) {
      const xi = spacing * i;
      for (let j = jMin; j <= jMax; j++) {
        const yj = spacing * j;
        const dx = xi - x;
        const dy = yj - y;
        if (dx * dx + dy * dy <= r * r) {
          state.gridUsesBase[i][j] = false;
          state.gridCustom[i][j] = penColor;
        }
      }
    }
  };

  const drawFurPattern = () => {
    const textureSettings = getTextureSettings();
    const {rows, cols, spacing} = calculateGridDimensions(
      textureSettings.density
    );

    p.strokeWeight(textureSettings.weight);
    p.push();
    p.blendMode(p.BLEND);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const posX = spacing * i;
        const posY = spacing * j;

        const col = state.gridUsesBase[i][j]
          ? textureSettings.baseColor
          : state.gridCustom[i][j];
        p.stroke(col);

        p.push();
        p.translate(posX, posY);
        p.rotate(
          p.PI *
            p.noise(
              posX / textureSettings.angleScale,
              posY / textureSettings.angleScale
            )
        );
        p.line(
          -textureSettings.lineLength / 2,
          0,
          textureSettings.lineLength / 2,
          0
        );
        p.pop();
      }
    }
    p.pop();
  };

  const drawEdgeFur = () => {
    const textureSettings = getTextureSettings();
    // Edge fur parameters
    const edgeDensity = 60;
    const edgeLineLength = 50;
    const edgeAngleScale = 65;
    const edgeWeight = 8;

    const drawWidth = drawSize.width;
    const drawHeight = drawSize.height;
    const margin = drawWidth * 0.05; // 5% margin on each side

    // Calculate grid dimensions for edge area
    const gridSpacing = (drawHeight - 1) / (edgeDensity - 1);
    const numCols = Math.floor((drawWidth - 1) / gridSpacing) + 1;
    const numRows = Math.floor((drawHeight - 1) / gridSpacing) + 1;

    p.strokeWeight(edgeWeight);
    p.push();
    p.blendMode(p.BLEND);
    p.stroke(textureSettings.backgroundColor);

    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numRows; j++) {
        const posX = gridSpacing * i;
        const posY = gridSpacing * j;

        // Check if this position is in the margin area (edge)
        const isInMargin =
          posX < margin ||
          posX > drawWidth - margin ||
          posY < margin ||
          posY > drawHeight - margin;

        if (isInMargin) {
          p.push();
          p.translate(posX, posY);
          p.rotate(
            p.PI * p.noise(posX / edgeAngleScale, posY / edgeAngleScale)
          );
          p.line(-edgeLineLength / 2, 0, edgeLineLength / 2, 0);
          p.pop();
        }
      }
    }
    p.pop();
  };

  const drawTextureBrushCursor = (transformedMouse: {x: number; y: number}) => {
    if (activeMode !== "texture") return;
    const textureSettings = getTextureSettings();
    const offset = {
      x: drawSize.width * 0.1,
      y: drawSize.height * 0.1,
    };
    const mouseInDrawArea =
      transformedMouse.x >= 0 &&
      transformedMouse.x < drawSize.width &&
      transformedMouse.y >= 0 &&
      transformedMouse.y < drawSize.height;

    if (mouseInDrawArea) {
      p.push();
      p.noFill();
      p.stroke(textureSettings.brushColor);
      p.strokeWeight(1);
      p.circle(
        transformedMouse.x + offset.x,
        transformedMouse.y + offset.y,
        textureSettings.brushRadius * 2
      );
      p.pop();
    }
  };

  return {
    ensureGridSize,
    paintAt,
    drawFurPattern,
    drawEdgeFur,
    drawTextureBrushCursor,
  };
};
