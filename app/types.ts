// 猫の目エディタの型定義
export interface Point {
  x: number;
  y: number;
}

export interface BezierControlPoints {
  cp1: Point;
  cp2: Point;
}

export interface EyeState {
  innerCorner: Point;
  outerCorner: Point;
  upperEyelid: BezierControlPoints;
  lowerEyelid: BezierControlPoints;
  iris: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
  };
  pupil: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface HandleModes {
  inner: boolean;
  outer: boolean;
}

export interface NoseSettings {
  y: number;         // Y position (height)
  scale: number;     // Size scale
  color: string;     // Nose color
}

// 毛並みエディタの型定義
export type GridCell = {
  usesBase: boolean;
  customColor: string;
};

export interface TextureSettings {
  density: number;
  lineLength: number;
  angleScale: number;
  weight: number;
  brushRadius: number;
  brushColor: string;
  backgroundColor: string;
}

// セーブデータ
export interface CatsEyeSaveData {
  version: 1;
  eyeState: EyeState;
  irisColor: string;
  eyeballColor: string;
  eyeballRadius: number;
  eyeSpacing: number;
  k_anchorConstraint: number;
  l_irisConstraint: number;
  m_irisScale: number;
  n_pupilScale: number;
  pupilWidthRatio: number;
  noseSettings: NoseSettings;
  textureSettings: TextureSettings;
  colorMapDataUrl: string | null;
}

// エディタモード
export type EditorMode = 'eye' | 'texture' | 'both';
