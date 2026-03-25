import {useRef, useCallback} from "react";

export interface UndoRedoState {
  eyeState: unknown;
  irisColor: string;
  eyeballColor: string;
  eyeballRadius: number;
  eyeSpacing: number;
  k_anchorConstraint: number;
  l_irisConstraint: number;
  m_irisScale: number;
  n_pupilScale: number;
  pupilWidthRatio: number;
  noseSettings: unknown;
  textureSettings: unknown;
  colorMapDataUrl: string | null;
}

const MAX_HISTORY = 10;

function statesEqual(a: UndoRedoState, b: UndoRedoState): boolean {
  // Compare everything except colorMapDataUrl for performance
  const {colorMapDataUrl: _a, ...restA} = a;
  const {colorMapDataUrl: _b, ...restB} = b;
  return JSON.stringify(restA) === JSON.stringify(restB) && _a === _b;
}

export function useUndoRedo() {
  const historyRef = useRef<UndoRedoState[]>([]);
  const indexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  const pushState = useCallback((state: UndoRedoState) => {
    if (isRestoringRef.current) return;

    const history = historyRef.current;
    const currentIndex = indexRef.current;

    // Skip if identical to current state
    if (currentIndex >= 0 && statesEqual(history[currentIndex], state)) return;

    // Truncate any future states
    historyRef.current = history.slice(0, currentIndex + 1);

    // Push new state
    historyRef.current.push(JSON.parse(JSON.stringify(state)));

    // Trim to max size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY);
    }

    indexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback((): UndoRedoState | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current--;
    isRestoringRef.current = true;
    const state = JSON.parse(JSON.stringify(historyRef.current[indexRef.current]));
    return state;
  }, []);

  const redo = useCallback((): UndoRedoState | null => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current++;
    isRestoringRef.current = true;
    const state = JSON.parse(JSON.stringify(historyRef.current[indexRef.current]));
    return state;
  }, []);

  const finishRestore = useCallback(() => {
    isRestoringRef.current = false;
  }, []);

  const canUndo = useCallback(() => indexRef.current > 0, []);
  const canRedo = useCallback(() => indexRef.current < historyRef.current.length - 1, []);

  return {pushState, undo, redo, finishRestore, canUndo, canRedo};
}
