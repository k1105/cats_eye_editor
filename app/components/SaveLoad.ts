import type {
  EyeState,
  NoseSettings,
  TextureSettings,
  CatsEyeSaveData,
} from "../types";

export interface BuildSaveDataParams {
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

export function buildSaveData(params: BuildSaveDataParams): CatsEyeSaveData {
  return {
    version: 1,
    ...params,
  };
}

export function serializeSaveData(data: CatsEyeSaveData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadSaveFile(json: string, filename?: string) {
  const name = filename ?? `catseye_${Date.now()}.catseye.json`;
  const blob = new Blob([json], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseSaveFile(file: File): Promise<CatsEyeSaveData> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (data.version !== 1) {
    throw new Error(`Unsupported save file version: ${data.version}`);
  }

  // Basic validation of required fields
  const requiredFields = [
    "eyeState",
    "irisColor",
    "eyeballColor",
    "eyeballRadius",
    "eyeSpacing",
    "k_anchorConstraint",
    "l_irisConstraint",
    "m_irisScale",
    "n_pupilScale",
    "pupilWidthRatio",
    "noseSettings",
    "textureSettings",
  ] as const;

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return data as CatsEyeSaveData;
}

export function openFilePicker(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".catseye.json,.json";
    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
    };
    // Handle cancel (no file selected)
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}
