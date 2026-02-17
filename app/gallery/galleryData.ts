import type {CatsEyeSaveData} from "../types";

const base: CatsEyeSaveData = {
  version: 1,
  eyeState: {
    innerCorner: {x: -66.27, y: 177.29},
    outerCorner: {x: 59.78, y: 211.56},
    upperEyelid: {cp1: {x: -59.4, y: 120.2}, cp2: {x: 66.3, y: 175.0}},
    lowerEyelid: {cp1: {x: -74.6, y: 246.1}, cp2: {x: 51.3, y: 258.8}},
    iris: {x: 0, y: 182.5, w: 161, h: 161, color: "#ffcc00"},
    pupil: {x: 0, y: 182.5, w: 107, h: 107},
  },
  irisColor: "#ffcc00",
  eyeballColor: "#e6e6e6",
  eyeballRadius: 115,
  eyeSpacing: 370.4,
  k_anchorConstraint: 0.578,
  l_irisConstraint: 0.95,
  m_irisScale: 0.7,
  n_pupilScale: 0.5,
  pupilWidthRatio: 0.5,
  noseSettings: {y: 289.2, scale: 1.1, color: "#171717"},
  textureSettings: {
    density: 60,
    lineLength: 66,
    angleScale: 60,
    weight: 1,
    brushRadius: 40,
    brushColor: "#5F5457",
    backgroundColor: "#545454",
  },
  colorMapDataUrl: null,
};

function variant(overrides: Partial<CatsEyeSaveData>): CatsEyeSaveData {
  const result = JSON.parse(JSON.stringify(base)) as CatsEyeSaveData;
  return {...result, ...overrides};
}

export const galleryItems: CatsEyeSaveData[] = [
  // 1. Default
  base,

  // 2. Sleepy / narrow eyes, green iris
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -55, y: 155}, cp2: {x: 60, y: 190}},
      lowerEyelid: {cp1: {x: -70, y: 220}, cp2: {x: 50, y: 235}},
      iris: {x: 0, y: 182.5, w: 161, h: 161, color: "#44aa44"},
      pupil: {x: 0, y: 182.5, w: 107, h: 107},
    },
    irisColor: "#44aa44",
    pupilWidthRatio: 0.35,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#4a4a3e",
    },
  }),

  // 3. Wide-open surprised eyes, blue iris
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -62, y: 95}, cp2: {x: 70, y: 155}},
      lowerEyelid: {cp1: {x: -78, y: 270}, cp2: {x: 55, y: 278}},
      iris: {x: 0, y: 182.5, w: 175, h: 175, color: "#3388dd"},
      pupil: {x: 0, y: 182.5, w: 120, h: 120},
    },
    irisColor: "#3388dd",
    eyeballRadius: 125,
    pupilWidthRatio: 0.7,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#3e4a55",
    },
  }),

  // 4. Cat slit pupils, amber iris
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 170, h: 170, color: "#dd8800"},
      pupil: {x: 0, y: 182.5, w: 115, h: 115},
    },
    irisColor: "#dd8800",
    pupilWidthRatio: 0.12,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#5a4a3a",
    },
  }),

  // 5. Big round eyes, warm pink iris
  variant({
    eyeState: {
      ...base.eyeState,
      innerCorner: {x: -72, y: 182},
      outerCorner: {x: 65, y: 200},
      upperEyelid: {cp1: {x: -65, y: 100}, cp2: {x: 72, y: 160}},
      lowerEyelid: {cp1: {x: -80, y: 268}, cp2: {x: 58, y: 272}},
      iris: {x: 0, y: 182.5, w: 180, h: 180, color: "#dd6699"},
      pupil: {x: 0, y: 182.5, w: 130, h: 130},
    },
    irisColor: "#dd6699",
    eyeballRadius: 130,
    pupilWidthRatio: 0.8,
    noseSettings: {y: 300, scale: 1.2, color: "#332222"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#554455",
    },
  }),

  // 6. Angled exotic eyes, purple iris
  variant({
    eyeState: {
      ...base.eyeState,
      innerCorner: {x: -60, y: 195},
      outerCorner: {x: 62, y: 175},
      upperEyelid: {cp1: {x: -52, y: 140}, cp2: {x: 68, y: 135}},
      lowerEyelid: {cp1: {x: -72, y: 248}, cp2: {x: 48, y: 228}},
      iris: {x: 0, y: 182.5, w: 155, h: 155, color: "#9955cc"},
      pupil: {x: 0, y: 182.5, w: 100, h: 100},
    },
    irisColor: "#9955cc",
    pupilWidthRatio: 0.4,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#484058",
    },
  }),

  // 7. Light background, blue-gray eyes
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 155, h: 155, color: "#7799bb"},
      pupil: {x: 0, y: 182.5, w: 100, h: 100},
    },
    irisColor: "#7799bb",
    eyeballColor: "#f0f0f0",
    pupilWidthRatio: 0.55,
    noseSettings: {y: 289.2, scale: 1.0, color: "#aa8888"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#c8beb4",
      weight: 1,
    },
  }),

  // 8. Small close-set eyes, red-orange iris
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 140, h: 140, color: "#cc4422"},
      pupil: {x: 0, y: 182.5, w: 90, h: 90},
    },
    irisColor: "#cc4422",
    eyeballRadius: 100,
    eyeSpacing: 350,
    pupilWidthRatio: 0.3,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#4d3a3a",
    },
  }),

  // 9. Heterochromia hint, teal iris, long fur
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -58, y: 115}, cp2: {x: 64, y: 168}},
      lowerEyelid: {cp1: {x: -72, y: 250}, cp2: {x: 53, y: 262}},
      iris: {x: 0, y: 182.5, w: 165, h: 165, color: "#22aa99"},
      pupil: {x: 0, y: 182.5, w: 110, h: 110},
    },
    irisColor: "#22aa99",
    pupilWidthRatio: 0.45,
    noseSettings: {y: 295, scale: 1.15, color: "#1a1a1a"},
    textureSettings: {
      ...base.textureSettings,
      lineLength: 85,
      density: 50,
      backgroundColor: "#3a4a4a",
    },
  }),
];
