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

  // 10. Golden round pupils, warm brown
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 160, h: 160, color: "#ccaa33"},
      pupil: {x: 0, y: 182.5, w: 110, h: 110},
    },
    irisColor: "#ccaa33",
    pupilWidthRatio: 0.9,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#5c4a2e",
      density: 70,
      lineLength: 55,
    },
  }),

  // 11. Icy blue, narrow slit
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -57, y: 140}, cp2: {x: 63, y: 180}},
      lowerEyelid: {cp1: {x: -71, y: 230}, cp2: {x: 50, y: 240}},
      iris: {x: 0, y: 182.5, w: 150, h: 150, color: "#88ccee"},
      pupil: {x: 0, y: 182.5, w: 100, h: 100},
    },
    irisColor: "#88ccee",
    pupilWidthRatio: 0.1,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#c0c8cc",
      weight: 1,
      density: 55,
    },
  }),

  // 12. Deep violet, wide eyes
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -64, y: 98}, cp2: {x: 70, y: 158}},
      lowerEyelid: {cp1: {x: -76, y: 268}, cp2: {x: 56, y: 275}},
      iris: {x: 0, y: 182.5, w: 175, h: 175, color: "#6633aa"},
      pupil: {x: 0, y: 182.5, w: 120, h: 120},
    },
    irisColor: "#6633aa",
    eyeballRadius: 125,
    pupilWidthRatio: 0.6,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#2d2040",
      lineLength: 75,
    },
  }),

  // 13. Olive green, small nose
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 155, h: 155, color: "#7a9944"},
      pupil: {x: 0, y: 182.5, w: 100, h: 100},
    },
    irisColor: "#7a9944",
    pupilWidthRatio: 0.35,
    noseSettings: {y: 285, scale: 0.85, color: "#222211"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#4a5038",
      density: 65,
      angleScale: 50,
    },
  }),

  // 14. Copper eyes, dense short fur
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 158, h: 158, color: "#bb6633"},
      pupil: {x: 0, y: 182.5, w: 105, h: 105},
    },
    irisColor: "#bb6633",
    pupilWidthRatio: 0.25,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#5a3e28",
      density: 85,
      lineLength: 40,
      weight: 1,
    },
  }),

  // 15. Pale lavender, round pupils, light fur
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -60, y: 105}, cp2: {x: 68, y: 162}},
      lowerEyelid: {cp1: {x: -75, y: 264}, cp2: {x: 54, y: 270}},
      iris: {x: 0, y: 182.5, w: 170, h: 170, color: "#bb99dd"},
      pupil: {x: 0, y: 182.5, w: 115, h: 115},
    },
    irisColor: "#bb99dd",
    eyeballRadius: 122,
    pupilWidthRatio: 0.85,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#b8a8c0",
      density: 50,
      lineLength: 70,
    },
  }),

  // 16. Yellow-green, wide spacing
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 150, h: 150, color: "#aacc22"},
      pupil: {x: 0, y: 182.5, w: 98, h: 98},
    },
    irisColor: "#aacc22",
    eyeSpacing: 400,
    pupilWidthRatio: 0.2,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#3a4428",
    },
  }),

  // 17. Warm cream fur, hazel eyes
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 158, h: 158, color: "#998855"},
      pupil: {x: 0, y: 182.5, w: 105, h: 105},
    },
    irisColor: "#998855",
    eyeballColor: "#f5f0e0",
    pupilWidthRatio: 0.5,
    noseSettings: {y: 290, scale: 1.0, color: "#cc9988"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#d4c8b0",
      density: 55,
      lineLength: 60,
    },
  }),

  // 18. Deep teal, angled exotic
  variant({
    eyeState: {
      ...base.eyeState,
      innerCorner: {x: -62, y: 192},
      outerCorner: {x: 60, y: 178},
      upperEyelid: {cp1: {x: -54, y: 138}, cp2: {x: 66, y: 138}},
      lowerEyelid: {cp1: {x: -70, y: 245}, cp2: {x: 48, y: 230}},
      iris: {x: 0, y: 182.5, w: 160, h: 160, color: "#228877"},
      pupil: {x: 0, y: 182.5, w: 108, h: 108},
    },
    irisColor: "#228877",
    pupilWidthRatio: 0.3,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#2a3a38",
      lineLength: 80,
      angleScale: 70,
    },
  }),

  // 19. Bright orange, slit pupil
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 168, h: 168, color: "#ee7722"},
      pupil: {x: 0, y: 182.5, w: 112, h: 112},
    },
    irisColor: "#ee7722",
    pupilWidthRatio: 0.15,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#4a3520",
      density: 75,
    },
  }),

  // 20. Steel gray, medium round
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 155, h: 155, color: "#8899aa"},
      pupil: {x: 0, y: 182.5, w: 102, h: 102},
    },
    irisColor: "#8899aa",
    eyeballColor: "#eaeaea",
    pupilWidthRatio: 0.65,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#505860",
      density: 60,
      lineLength: 62,
    },
  }),

  // 21. Rose pink, big round
  variant({
    eyeState: {
      ...base.eyeState,
      innerCorner: {x: -70, y: 180},
      outerCorner: {x: 64, y: 198},
      upperEyelid: {cp1: {x: -63, y: 102}, cp2: {x: 70, y: 158}},
      lowerEyelid: {cp1: {x: -78, y: 266}, cp2: {x: 56, y: 270}},
      iris: {x: 0, y: 182.5, w: 178, h: 178, color: "#ee88aa"},
      pupil: {x: 0, y: 182.5, w: 125, h: 125},
    },
    irisColor: "#ee88aa",
    eyeballRadius: 128,
    pupilWidthRatio: 0.75,
    noseSettings: {y: 298, scale: 1.15, color: "#442233"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#5a3848",
      density: 55,
    },
  }),

  // 22. Dark chocolate, amber slit
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -56, y: 132}, cp2: {x: 62, y: 178}},
      lowerEyelid: {cp1: {x: -70, y: 238}, cp2: {x: 50, y: 248}},
      iris: {x: 0, y: 182.5, w: 152, h: 152, color: "#ddaa44"},
      pupil: {x: 0, y: 182.5, w: 100, h: 100},
    },
    irisColor: "#ddaa44",
    pupilWidthRatio: 0.18,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#302018",
      density: 80,
      lineLength: 45,
    },
  }),

  // 23. Sky blue, wide open
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -63, y: 92}, cp2: {x: 71, y: 152}},
      lowerEyelid: {cp1: {x: -77, y: 272}, cp2: {x: 55, y: 280}},
      iris: {x: 0, y: 182.5, w: 180, h: 180, color: "#55aaee"},
      pupil: {x: 0, y: 182.5, w: 128, h: 128},
    },
    irisColor: "#55aaee",
    eyeballRadius: 130,
    pupilWidthRatio: 0.7,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#384858",
      lineLength: 72,
    },
  }),

  // 24. Chartreuse, close-set
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 145, h: 145, color: "#88bb22"},
      pupil: {x: 0, y: 182.5, w: 95, h: 95},
    },
    irisColor: "#88bb22",
    eyeSpacing: 340,
    eyeballRadius: 105,
    pupilWidthRatio: 0.28,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#404830",
      density: 68,
      angleScale: 55,
    },
  }),

  // 25. Salmon pink, soft fur
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 162, h: 162, color: "#dd7766"},
      pupil: {x: 0, y: 182.5, w: 108, h: 108},
    },
    irisColor: "#dd7766",
    eyeballColor: "#f2ece6",
    pupilWidthRatio: 0.55,
    noseSettings: {y: 288, scale: 1.05, color: "#bb7766"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#c4a898",
      density: 45,
      lineLength: 78,
      weight: 1,
    },
  }),

  // 26. Midnight blue, tiny bright iris
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -55, y: 148}, cp2: {x: 60, y: 185}},
      lowerEyelid: {cp1: {x: -68, y: 225}, cp2: {x: 48, y: 238}},
      iris: {x: 0, y: 182.5, w: 135, h: 135, color: "#44ddff"},
      pupil: {x: 0, y: 182.5, w: 88, h: 88},
    },
    irisColor: "#44ddff",
    eyeballRadius: 108,
    pupilWidthRatio: 0.4,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#1a2030",
      density: 70,
      lineLength: 58,
    },
  }),

  // 27. Warm peach, wide spacing, round pupils
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 158, h: 158, color: "#cc8855"},
      pupil: {x: 0, y: 182.5, w: 105, h: 105},
    },
    irisColor: "#cc8855",
    eyeSpacing: 390,
    eyeballColor: "#f0ece4",
    pupilWidthRatio: 0.8,
    noseSettings: {y: 292, scale: 1.1, color: "#aa7755"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#c8b4a0",
      density: 52,
      lineLength: 68,
    },
  }),

  // 28. Emerald, angular exotic
  variant({
    eyeState: {
      ...base.eyeState,
      innerCorner: {x: -58, y: 198},
      outerCorner: {x: 64, y: 172},
      upperEyelid: {cp1: {x: -50, y: 135}, cp2: {x: 70, y: 130}},
      lowerEyelid: {cp1: {x: -68, y: 250}, cp2: {x: 50, y: 225}},
      iris: {x: 0, y: 182.5, w: 165, h: 165, color: "#33bb55"},
      pupil: {x: 0, y: 182.5, w: 112, h: 112},
    },
    irisColor: "#33bb55",
    pupilWidthRatio: 0.22,
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#283828",
      lineLength: 82,
      angleScale: 65,
    },
  }),

  // 29. Dusty mauve, sleepy
  variant({
    eyeState: {
      ...base.eyeState,
      upperEyelid: {cp1: {x: -54, y: 158}, cp2: {x: 58, y: 192}},
      lowerEyelid: {cp1: {x: -68, y: 218}, cp2: {x: 48, y: 232}},
      iris: {x: 0, y: 182.5, w: 148, h: 148, color: "#aa7799"},
      pupil: {x: 0, y: 182.5, w: 96, h: 96},
    },
    irisColor: "#aa7799",
    pupilWidthRatio: 0.42,
    noseSettings: {y: 286, scale: 0.95, color: "#553344"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#584050",
      density: 58,
      lineLength: 65,
    },
  }),

  // 30. Pure white fur, gold eyes
  variant({
    eyeState: {
      ...base.eyeState,
      iris: {x: 0, y: 182.5, w: 162, h: 162, color: "#ddbb33"},
      pupil: {x: 0, y: 182.5, w: 108, h: 108},
    },
    irisColor: "#ddbb33",
    eyeballColor: "#f8f8f0",
    pupilWidthRatio: 0.5,
    noseSettings: {y: 290, scale: 1.05, color: "#ddaaa0"},
    textureSettings: {
      ...base.textureSettings,
      backgroundColor: "#e8e0d8",
      density: 48,
      lineLength: 72,
      weight: 1,
    },
  }),
];
