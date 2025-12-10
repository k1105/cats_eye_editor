import type p5Type from "p5";
import type {TextureSettings} from "../types";

interface TextureEditorProps {
  settings: TextureSettings;
  canvasSize: {width: number; height: number};
  onResetBrush?: () => void;
  isActive?: boolean;
}

export const createTextureEditorSketch = () => {
  return (p: p5Type, props: Record<string, unknown>) => {
    let currentProps = props as unknown as TextureEditorProps;
    let gridUsesBase: boolean[][] = [];
    let gridCustom: string[][] = [];
    let lastNumLines = -1;

    p.setup = () => {
      p.createCanvas(
        currentProps.canvasSize.width,
        currentProps.canvasSize.height
      );
      p.pixelDensity(p.displayDensity());
      p.strokeCap(p.PROJECT);
    };

    (
      p as p5Type & {
        updateWithProps?: (newProps: Record<string, unknown>) => void;
      }
    ).updateWithProps = (newProps: Record<string, unknown>) => {
      const typedProps = newProps as unknown as TextureEditorProps;
      if (
        currentProps.canvasSize &&
        (currentProps.canvasSize.width !== typedProps.canvasSize.width ||
          currentProps.canvasSize.height !== typedProps.canvasSize.height)
      ) {
        p.resizeCanvas(
          typedProps.canvasSize.width,
          typedProps.canvasSize.height
        );
      }
      currentProps = typedProps;
    };

    const calculateGridDimensions = (density: number) => {
      // 縦横等間隔の方眼を作成
      // densityは縦方向の線の数とする
      const gridSpacing = (p.height - 1) / (density - 1);
      const numCols = Math.floor((p.width - 1) / gridSpacing) + 1;
      return {rows: density, cols: numCols, spacing: gridSpacing};
    };

    const ensureGridSize = (numLines: number) => {
      if (numLines === lastNumLines && gridUsesBase.length) return;

      const {rows, cols} = calculateGridDimensions(numLines);

      gridUsesBase = Array.from({length: cols}, () =>
        Array.from({length: rows}, () => true)
      );

      gridCustom = Array.from({length: cols}, () =>
        Array.from({length: rows}, () => currentProps.settings.brushColor)
      );

      lastNumLines = numLines;
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
            gridUsesBase[i][j] = false;
            gridCustom[i][j] = penColor;
          }
        }
      }
    };

    const lineField = (
      numLines: number,
      lineLength: number,
      detailness: number,
      weight: number
    ) => {
      p.strokeWeight(weight);
      p.push();
      p.blendMode(p.BLEND);

      const {rows, cols, spacing} = calculateGridDimensions(numLines);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const posX = spacing * i;
          const posY = spacing * j;

          const col = gridUsesBase[i][j]
            ? currentProps.settings.baseColor
            : gridCustom[i][j];
          p.stroke(col);

          p.push();
          p.translate(posX, posY);
          p.rotate(p.PI * p.noise(posX / detailness, posY / detailness));
          p.line(-lineLength / 2, 0, lineLength / 2, 0);
          p.pop();
        }
      }
      p.pop();
    };

    const mouseInCanvas = () => {
      return (
        p.mouseX >= 0 &&
        p.mouseX < p.width &&
        p.mouseY >= 0 &&
        p.mouseY < p.height
      );
    };

    p.draw = () => {
      p.background(currentProps.settings.backgroundColor);

      const n = currentProps.settings.density;
      ensureGridSize(n);

      const isActive = currentProps.isActive !== false;

      if (isActive && p.mouseIsPressed && mouseInCanvas()) {
        paintAt(
          p.mouseX,
          p.mouseY,
          currentProps.settings.brushRadius,
          currentProps.settings.brushColor,
          n
        );
      }

      lineField(
        n,
        currentProps.settings.lineLength,
        currentProps.settings.angleScale,
        currentProps.settings.weight
      );

      if (isActive && mouseInCanvas()) {
        p.push();
        p.noFill();
        p.stroke(currentProps.settings.brushColor);
        p.strokeWeight(1);
        p.circle(p.mouseX, p.mouseY, currentProps.settings.brushRadius * 2);
        p.pop();
      }
    };

    p.keyPressed = () => {
      if (p.key === "r" || p.key === "R") {
        if (currentProps.onResetBrush) {
          currentProps.onResetBrush();
        }
        for (let i = 0; i < gridUsesBase.length; i++) {
          gridUsesBase[i].fill(true);
        }
      }
    };
  };
};
