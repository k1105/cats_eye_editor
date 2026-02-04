import type p5Type from "p5";
import type {TextureSettings} from "../types";

export interface FurDrawingState {
  gridUsesBase: boolean[][];
  gridCustom: string[][];
  lastNumLines: number;
  colorMap: p5Type.Graphics | null;
  colorMapInitialized: boolean;
  initialBaseColor: string | null; // colorMap初期化時に使用されたbaseColor

  // --- Optimization Refs ---
  furLayer: p5Type.Graphics | null;
  needsRedraw: boolean;
  prevSettingsHash: string;

  // --- Brush Color Tracking ---
  usedBrushColors: Set<string>;
}

export interface FurDrawingContext {
  p: p5Type;
  textureSettings: TextureSettings;
  drawSize: {width: number; height: number};
  activeMode: "eye" | "texture";
}

// 毛がキャンバス外にはみ出すのを許容するためのバッファ余白
// これがないと、(-10, -10)などの座標に描かれた毛先がクリップされてパッツン前髪のようになります
export const BUFFER_MARGIN = 100;

export const createFurDrawing = (
  context: FurDrawingContext,
  state: FurDrawingState
) => {
  const {p, drawSize, activeMode} = context;

  const getTextureSettings = () => context.textureSettings;

  const generateSettingsHash = (
    settings: TextureSettings,
    size: {width: number; height: number}
  ) => {
    return JSON.stringify(settings) + `_${size.width}x${size.height}`;
  };

  const calculateGridDimensions = (density: number) => {
    const drawHeight = drawSize.height;
    const drawWidth = drawSize.width;
    const gridSpacing = (drawHeight - 1) / (density - 1);
    const numCols = Math.floor((drawWidth - 1) / gridSpacing) + 1;
    return {rows: density, cols: numCols, spacing: gridSpacing};
  };

  // カラーマップは「論理的な座標（あたり判定）」に使うため、マージンなしの原寸大で管理する
  const initializeColorMap = () => {
    if (state.colorMapInitialized && state.colorMap) return;

    const textureSettings = getTextureSettings();
    const graphics = p.createGraphics(drawSize.width, drawSize.height);
    graphics.pixelDensity(1);
    graphics.colorMode(p.RGB);
    graphics.background(textureSettings.baseColor);

    state.colorMap = graphics;
    state.colorMapInitialized = true;
    state.initialBaseColor = textureSettings.baseColor; // 初期化時のbaseColorを記録

    // 使用されたブラシ色のセットを初期化
    if (!state.usedBrushColors) {
      state.usedBrushColors = new Set<string>();
    }
  };

  const ensureGridSize = (numLines: number) => {
    initializeColorMap();

    if (numLines !== state.lastNumLines || !state.gridUsesBase.length) {
      const {rows, cols} = calculateGridDimensions(numLines);
      state.gridUsesBase = Array.from({length: cols}, () =>
        Array.from({length: rows}, () => true)
      );
      state.gridCustom = Array.from({length: cols}, () =>
        Array.from({length: rows}, () => getTextureSettings().brushColor)
      );
      state.lastNumLines = numLines;
      state.needsRedraw = true;
    }
  };

  const paintAt = (
    x: number,
    y: number,
    r: number,
    penColor: string,
    numLines: number
  ) => {
    initializeColorMap();
    if (!state.colorMap) return;

    // 使用されたブラシ色を記録
    if (!state.usedBrushColors) {
      state.usedBrushColors = new Set<string>();
    }
    const textureSettings = getTextureSettings();
    // baseColorと異なる色のみ記録
    if (penColor.toLowerCase() !== textureSettings.baseColor.toLowerCase()) {
      state.usedBrushColors.add(penColor);
    }

    state.colorMap.push();
    state.colorMap.noStroke();
    state.colorMap.fill(penColor);
    state.colorMap.circle(x, y, r * 2);
    state.colorMap.pop();

    state.needsRedraw = true;
  };

  const resetBrush = () => {
    const textureSettings = getTextureSettings();
    if (state.colorMap) {
      state.colorMap.background(textureSettings.baseColor);
      state.initialBaseColor = textureSettings.baseColor; // リセット時のbaseColorを記録
    }
    state.colorMapInitialized = false;
    state.gridUsesBase.forEach((cell) => cell.fill(true));
    // 使用されたブラシ色のセットをリセット
    if (state.usedBrushColors) {
      state.usedBrushColors.clear();
    }
    state.needsRedraw = true;
  };

  // --- Rendering Helpers (Draws relative to 0,0) ---

  const renderFurPatternToLayer = (targetLayer: p5Type.Graphics) => {
    const textureSettings = getTextureSettings();
    const {rows, cols, spacing} = calculateGridDimensions(
      textureSettings.density
    );

    initializeColorMap();
    let pixels: number[] | null = null;
    if (state.colorMap) {
      state.colorMap.loadPixels();
      pixels = state.colorMap.pixels as number[];
    }

    targetLayer.strokeWeight(textureSettings.weight);
    targetLayer.push();
    //targetLayer.blendMode(targetLayer.BLEND);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const posX = spacing * i;
        const posY = spacing * j;

        let col: string;
        if (pixels && state.colorMap) {
          const x = p.constrain(Math.floor(posX), 0, drawSize.width - 1);
          const y = p.constrain(Math.floor(posY), 0, drawSize.height - 1);
          const index = (y * drawSize.width + x) * 4;
          const r = Math.round(pixels[index] || 0);
          const g = Math.round(pixels[index + 1] || 0);
          const b = Math.round(pixels[index + 2] || 0);
          col = `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          
          // colorMapから読み取った色が初期baseColorと一致する場合は、
          // 現在のbaseColorパラメータを使う（baseColor変更に対応）
          if (
            state.initialBaseColor &&
            col.toLowerCase() === state.initialBaseColor.toLowerCase()
          ) {
            col = textureSettings.baseColor;
          }
        } else {
          col = textureSettings.baseColor;
        }

        targetLayer.stroke(col);
        targetLayer.push();
        targetLayer.translate(posX, posY);
        targetLayer.rotate(
          p.PI *
            p.noise(
              posX / textureSettings.angleScale,
              posY / textureSettings.angleScale
            )
        );
        targetLayer.line(
          -textureSettings.lineLength / 2,
          0,
          textureSettings.lineLength / 2,
          0
        );
        targetLayer.pop();
      }
    }
    targetLayer.pop();
  };

  /**
   * 統合された描画関数
   */
  const renderStaticFur = () => {
    const textureSettings = getTextureSettings();

    // 設定変更検知
    const currentHash = generateSettingsHash(textureSettings, drawSize);
    if (currentHash !== state.prevSettingsHash) {
      state.needsRedraw = true;
      state.prevSettingsHash = currentHash;
    }

    // バッファサイズは描画エリア + マージン(BUFFER_MARGIN * 2)
    const bufferedWidth = drawSize.width + BUFFER_MARGIN * 2;
    const bufferedHeight = drawSize.height + BUFFER_MARGIN * 2;

    if (
      !state.furLayer ||
      state.furLayer.width !== bufferedWidth ||
      state.furLayer.height !== bufferedHeight
    ) {
      state.furLayer = p.createGraphics(bufferedWidth, bufferedHeight);
      state.furLayer.pixelDensity(p.pixelDensity());
      state.furLayer.strokeCap(p.PROJECT);
      state.needsRedraw = true;
    }

    // 再描画処理
    if (state.needsRedraw && state.furLayer) {
      state.furLayer.clear(); // 透明にリセット

      state.furLayer.push();
      // マージン分だけ原点をずらす。これで (0,0) への描画がバッファの中央付近に来る
      state.furLayer.translate(BUFFER_MARGIN, BUFFER_MARGIN);

      // メインの毛
      renderFurPatternToLayer(state.furLayer);

      state.furLayer.pop();
      state.needsRedraw = false;
    }

    // メインキャンバスへの転写は、マージン分マイナスした位置に行う
    if (state.furLayer) {
      p.image(state.furLayer, -BUFFER_MARGIN, -BUFFER_MARGIN);
    }
  };

  const drawTextureBrushCursor = (transformedMouse: {x: number; y: number}) => {
    if (activeMode !== "texture") return;
    const textureSettings = getTextureSettings();
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
      // カーソルはメインキャンバスに直接描くので、BUFFER_MARGINの考慮は不要
      // (UnifiedEditorSketch側で offset 分translateされている前提)
      p.circle(
        transformedMouse.x,
        transformedMouse.y,
        textureSettings.brushRadius * 2
      );
      p.pop();
    }
  };

  /**
   * 使用されているブラシ色のリストを取得する
   * 実際にpaintAtで使用された色のみを返す
   */
  const getUsedBrushColors = (): string[] => {
    if (!state.usedBrushColors) {
      state.usedBrushColors = new Set<string>();
    }
    return Array.from(state.usedBrushColors).sort();
  };

  /**
   * colorMap内の特定の色を全て新しい色に置き換える
   */
  const replaceBrushColor = (oldColor: string, newColor: string) => {
    initializeColorMap();
    if (!state.colorMap) return;

    // 使用されたブラシ色のセットを更新
    if (state.usedBrushColors) {
      state.usedBrushColors.delete(oldColor);
      state.usedBrushColors.add(newColor);
    }

    state.colorMap.loadPixels();
    const pixels = state.colorMap.pixels as number[];

    // 古い色をRGBに変換
    const oldR = parseInt(oldColor.slice(1, 3), 16);
    const oldG = parseInt(oldColor.slice(3, 5), 16);
    const oldB = parseInt(oldColor.slice(5, 7), 16);

    // 新しい色をRGBに変換
    const newR = parseInt(newColor.slice(1, 3), 16);
    const newG = parseInt(newColor.slice(3, 5), 16);
    const newB = parseInt(newColor.slice(5, 7), 16);

    // 色の置き換え（許容誤差を設けて、わずかな違いも検出）
    const tolerance = 2;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = Math.round(pixels[i] || 0);
      const g = Math.round(pixels[i + 1] || 0);
      const b = Math.round(pixels[i + 2] || 0);

      if (
        Math.abs(r - oldR) <= tolerance &&
        Math.abs(g - oldG) <= tolerance &&
        Math.abs(b - oldB) <= tolerance
      ) {
        pixels[i] = newR;
        pixels[i + 1] = newG;
        pixels[i + 2] = newB;
      }
    }

    state.colorMap.updatePixels();
    state.needsRedraw = true;
  };

  return {
    ensureGridSize,
    paintAt,
    resetBrush,
    renderStaticFur,
    drawTextureBrushCursor,
    getUsedBrushColors,
    replaceBrushColor,
  };
};
