"use client";

import React, {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";
import type {
  EyeState,
  HandleModes,
  TextureSettings,
  NoseSettings,
  EdgeFurSettings,
} from "../types";

export const INIT_TEXTURE_SETTINGS: TextureSettings = {
  density: 60,
  lineLength: 66,
  angleScale: 255,
  weight: 1,
  brushRadius: 37,
  brushColor: "#ff7b00",
  backgroundColor: "#f5f5f5",
};

export const INIT_EYE_STATE: EyeState = {
  innerCorner: {x: -66.26568339566096, y: 197.29230337807354},
  outerCorner: {x: 59.783007794463956, y: 231.55602999459944},
  upperEyelid: {
    cp1: {x: -50.53080477908028, y: 146.4380241208296},
    cp2: {x: 66.3, y: 195.0},
  },
  lowerEyelid: {
    cp1: {x: -86.75289106223163, y: 263.50585387722185},
    cp2: {x: 51.3, y: 278.8},
  },
  iris: {x: 0, y: 202.5, w: 161, h: 161, color: "#ffcc02"},
  pupil: {x: 0, y: 202.5, w: 115, h: 115},
};

export const INIT_NOSE_SETTINGS: NoseSettings = {
  y: 290,
  scale: 1.1,
  color: "#171717",
};

export const INIT_EDGE_FUR_SETTINGS: EdgeFurSettings = {
  enabled: true,
  falloffBase: 60,
  falloffWave: 0,
  waveScale: 20,
  cornerRadius: 50,
};

export const INIT_IRIS_COLOR = "#ffcc02";
export const INIT_EYEBALL_COLOR = "#e6e6e6";
export const INIT_EYEBALL_RADIUS = 115;
export const INIT_EYE_SPACING = 350;
export const INIT_K_ANCHOR_CONSTRAINT = 0.578;
export const INIT_L_IRIS_CONSTRAINT = 0.95;
export const INIT_M_IRIS_SCALE = 0.7;
export const INIT_N_PUPIL_SCALE = 0.5;
export const INIT_PUPIL_WIDTH_RATIO = 0.5732134806131649;

interface EditorStateContextValue {
  textureSettings: TextureSettings;
  setTextureSettings: Dispatch<SetStateAction<TextureSettings>>;

  eyeState: EyeState;
  setEyeState: Dispatch<SetStateAction<EyeState>>;

  handleModes: HandleModes;
  setHandleModes: Dispatch<SetStateAction<HandleModes>>;

  irisColor: string;
  setIrisColor: Dispatch<SetStateAction<string>>;

  eyeballColor: string;
  setEyeballColor: Dispatch<SetStateAction<string>>;

  eyeballRadius: number;
  setEyeballRadius: Dispatch<SetStateAction<number>>;

  eyeSpacing: number;
  setEyeSpacing: Dispatch<SetStateAction<number>>;

  k_anchorConstraint: number;
  setK_anchorConstraint: Dispatch<SetStateAction<number>>;

  l_irisConstraint: number;
  setL_irisConstraint: Dispatch<SetStateAction<number>>;

  m_irisScale: number;
  setM_irisScale: Dispatch<SetStateAction<number>>;

  n_pupilScale: number;
  setN_pupilScale: Dispatch<SetStateAction<number>>;

  noseSettings: NoseSettings;
  setNoseSettings: Dispatch<SetStateAction<NoseSettings>>;

  pupilWidthRatio: number;
  setPupilWidthRatio: Dispatch<SetStateAction<number>>;

  edgeFurSettings: EdgeFurSettings;
  setEdgeFurSettings: Dispatch<SetStateAction<EdgeFurSettings>>;

  persistedColorMap: string | null;
  setPersistedColorMap: Dispatch<SetStateAction<string | null>>;
}

const EditorStateContext = createContext<EditorStateContextValue | null>(null);

export const EditorStateProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [textureSettings, setTextureSettings] = useState<TextureSettings>(
    INIT_TEXTURE_SETTINGS,
  );
  const [eyeState, setEyeState] = useState<EyeState>(INIT_EYE_STATE);
  const [handleModes, setHandleModes] = useState<HandleModes>({
    inner: true,
    outer: true,
  });
  const [irisColor, setIrisColor] = useState(INIT_IRIS_COLOR);
  const [eyeballColor, setEyeballColor] = useState(INIT_EYEBALL_COLOR);
  const [eyeballRadius, setEyeballRadius] = useState(INIT_EYEBALL_RADIUS);
  const [eyeSpacing, setEyeSpacing] = useState(INIT_EYE_SPACING);
  const [k_anchorConstraint, setK_anchorConstraint] = useState(
    INIT_K_ANCHOR_CONSTRAINT,
  );
  const [l_irisConstraint, setL_irisConstraint] = useState(
    INIT_L_IRIS_CONSTRAINT,
  );
  const [m_irisScale, setM_irisScale] = useState(INIT_M_IRIS_SCALE);
  const [n_pupilScale, setN_pupilScale] = useState(INIT_N_PUPIL_SCALE);
  const [noseSettings, setNoseSettings] =
    useState<NoseSettings>(INIT_NOSE_SETTINGS);
  const [pupilWidthRatio, setPupilWidthRatio] = useState(
    INIT_PUPIL_WIDTH_RATIO,
  );
  const [edgeFurSettings, setEdgeFurSettings] = useState<EdgeFurSettings>(
    INIT_EDGE_FUR_SETTINGS,
  );
  const [persistedColorMap, setPersistedColorMap] = useState<string | null>(
    null,
  );

  return (
    <EditorStateContext.Provider
      value={{
        textureSettings,
        setTextureSettings,
        eyeState,
        setEyeState,
        handleModes,
        setHandleModes,
        irisColor,
        setIrisColor,
        eyeballColor,
        setEyeballColor,
        eyeballRadius,
        setEyeballRadius,
        eyeSpacing,
        setEyeSpacing,
        k_anchorConstraint,
        setK_anchorConstraint,
        l_irisConstraint,
        setL_irisConstraint,
        m_irisScale,
        setM_irisScale,
        n_pupilScale,
        setN_pupilScale,
        noseSettings,
        setNoseSettings,
        pupilWidthRatio,
        setPupilWidthRatio,
        edgeFurSettings,
        setEdgeFurSettings,
        persistedColorMap,
        setPersistedColorMap,
      }}
    >
      {children}
    </EditorStateContext.Provider>
  );
};

export function useEditorState(): EditorStateContextValue {
  const ctx = useContext(EditorStateContext);
  if (!ctx)
    throw new Error("useEditorState must be used within EditorStateProvider");
  return ctx;
}
