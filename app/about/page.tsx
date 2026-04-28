"use client";

import {useEffect, useRef, useState} from "react";
import {useLenis} from "lenis/react";
import styles from "./page.module.css";

const YOKO_PATTERNS = ["a", "b", "c", "d"] as const;
const TATE_PATTERNS = ["a", "b", "c"] as const;
type Pattern = "a" | "b" | "c" | "d";

const BIN_SVG_W = 1259.42;
const BIN_SVG_H = 1624.54;
const CAT_SVG_W = 424.14;
const CAT_SVG_H = 344.76;

type PcLayout = {
  binMaskH: number;
  binRightGrid: number;
  catSize: number;
  catFaceX: number;
  catFaceY: number;
};

type SpLayout = {
  binMaskH: number;
  binAxisOffsetVw: number;
  catSize: number;
  catFaceX: number;
  catFaceY: number;
};

const DEFAULT_PC_LAYOUT: PcLayout = {
  binMaskH: 62,
  binRightGrid: 1.65,
  catSize: 0.675,
  catFaceX: -0.13,
  catFaceY: 0.65,
};

const DEFAULT_SP_LAYOUT: SpLayout = {
  binMaskH: 42.5,
  binAxisOffsetVw: 29,
  catSize: 0.675,
  catFaceX: -0.13,
  catFaceY: 0.65,
};

export default function AboutPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [pattern, setPattern] = useState<Pattern>("a");
  const [debugOpen, setDebugOpen] = useState(false);
  const [pcLayout, setPcLayout] = useState<PcLayout>(DEFAULT_PC_LAYOUT);
  const [spLayout, setSpLayout] = useState<SpLayout>(DEFAULT_SP_LAYOUT);
  const [copied, setCopied] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useLenis(() => {
    const main = mainRef.current;
    if (!main || window.matchMedia("(max-width: 767px)").matches) return;
    const gridCol = window.innerWidth / 20;
    const rect = main.getBoundingClientRect();
    const clipBottom = Math.max(
      0,
      rect.bottom - (window.innerHeight - gridCol * 1.25),
    );
    main.style.clipPath = clipBottom > 0 ? `inset(0 0 ${clipBottom}px 0)` : "";
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setDebugOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const availablePatterns = isMobile ? TATE_PATTERNS : YOKO_PATTERNS;
  const effectivePattern: Pattern = (
    availablePatterns as readonly string[]
  ).includes(pattern)
    ? pattern
    : "a";
  const texPrefix = isMobile ? "tex_tate_" : "tex_yoko_";
  const texUrl = `/texture/${texPrefix}${effectivePattern}.png`;

  // Derived layout values (in vh)
  const layout = isMobile ? spLayout : pcLayout;
  const binElHvh = layout.binMaskH;
  const binWvh = layout.binMaskH * (BIN_SVG_W / BIN_SVG_H);
  const catHvh = binElHvh * layout.catSize;
  const catWvh = (catHvh * CAT_SVG_W) / CAT_SVG_H;
  const catBottomVh = layout.binMaskH * (1 - layout.catFaceY) - catHvh / 2;

  let binStyle: React.CSSProperties;
  let catStyle: React.CSSProperties;

  if (isMobile) {
    // Bin's center anchored to (50% + axis offset). Use `left` for absolute positioning.
    binStyle = {
      height: `${binElHvh}vh`,
      left: `calc(50vw + ${spLayout.binAxisOffsetVw}vw - ${binWvh / 2}vh)`,
    };
    // Cat face center x = bin_left + catFaceX * binWvh
    // Cat element left = face_x - catWvh/2 = (50vw + offsetVw vw - binWvh/2 vh) + catFaceX * binWvh vh - catWvh/2 vh
    //                  = 50vw + offsetVw vw + ((catFaceX - 0.5) * binWvh - catWvh/2) vh
    const catLeftOffsetVh = (spLayout.catFaceX - 0.5) * binWvh - catWvh / 2;
    catStyle = {
      height: `${catHvh}vh`,
      bottom: `${catBottomVh}vh`,
      left: `calc(50vw + ${spLayout.binAxisOffsetVw}vw + ${catLeftOffsetVh}vh)`,
    };
  } else {
    const catRightExtraVh = binWvh * (1 - pcLayout.catFaceX) - catWvh / 2;
    binStyle = {
      height: `${binElHvh}vh`,
      right: `calc(var(--grid-col) * ${pcLayout.binRightGrid})`,
    };
    catStyle = {
      height: `${catHvh}vh`,
      bottom: `${catBottomVh}vh`,
      right: `calc(var(--grid-col) * ${pcLayout.binRightGrid} + ${catRightExtraVh}vh)`,
    };
  }

  const updatePc =
    (key: keyof PcLayout) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setPcLayout((s) => ({...s, [key]: v}));
    };
  const updateSp =
    (key: keyof SpLayout) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setSpLayout((s) => ({...s, [key]: v}));
    };

  const copyLayout = async () => {
    const snippet = isMobile
      ? `const DEFAULT_SP_LAYOUT: SpLayout = {
  binMaskH: ${spLayout.binMaskH},
  binAxisOffsetVw: ${spLayout.binAxisOffsetVw},
  catSize: ${spLayout.catSize},
  catFaceX: ${spLayout.catFaceX},
  catFaceY: ${spLayout.catFaceY},
};`
      : `const DEFAULT_PC_LAYOUT: PcLayout = {
  binMaskH: ${pcLayout.binMaskH},
  binRightGrid: ${pcLayout.binRightGrid},
  catSize: ${pcLayout.catSize},
  catFaceX: ${pcLayout.catFaceX},
  catFaceY: ${pcLayout.catFaceY},
};`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div aria-hidden className={styles.bgOrange} />
      <div className={styles.pageWrapper}>
        <main className={styles.main} ref={mainRef}>
          <h1 className={styles.heading}>
            <img
              src="/headline_E.svg"
              alt="Curiosity Saves the Cat."
              className={styles.headlineImg}
            />
            <img
              src="/headline_J.svg"
              alt="好奇心は、猫を救う。"
              className={styles.headlineImgJ}
            />
          </h1>

          <div className={styles.body}>
            <p>
              気になるものは嗅いでみる。
              <br />
              物音に耳だけくるりと向ける。
              <br />
              隙間があれば前足を差し込む。
            </p>

            <p>
              好奇心旺盛な猫と人が
              <br className={styles.spOnly} />
              暮らしはじめて約9500年。
              <br />
              古くは浮世絵や文学にも好んで描かれ、
              <br />
              AIが画像の海から見出した
              <br className={styles.spOnly} />
              最初の生物も、猫でした。
              <br />
              猫ミームはインターネットを駆けめぐり、
              <br />
              今や空前の猫ブームが訪れています。
            </p>

            <p>
              笑いも、癒しも。
              <br />
              毎日かけがえのないものを
              <br className={styles.spOnly} />
              くれる猫たちに報いたい。
              <br />
              そんな想いで結ばれたメンバーが集まり、
              <br />
              Neko Lab Tokyoは誕生しました。
            </p>

            <p>
              これは、好奇心と創造力で
              <br />
              猫と人との関係を
              <br className={styles.spOnly} />
              より良くしていくプロジェクト。
              <br />
              今度は人間が、猫たちに
              <br className={styles.spOnly} />
              負けない好奇心を発揮する番です。
            </p>
          </div>
        </main>

        <img
          aria-hidden
          src="/cat.svg"
          alt=""
          className={styles.cat}
          style={catStyle}
        />
        <div aria-hidden className={styles.bottomBlock} />
        <img
          aria-hidden
          src="/bin.svg"
          alt=""
          className={styles.bin}
          style={binStyle}
        />
      </div>
      <div
        aria-hidden
        className={styles.texture}
        style={{backgroundImage: `url(${texUrl})`}}
      />

      {debugOpen && (
        <div className={styles.debugPanel}>
          <div className={styles.debugHeader}>
            <strong>Texture Debug</strong>
            <button
              onClick={() => setDebugOpen(false)}
              className={styles.debugClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className={styles.debugLabel}>
            {isMobile ? "SP (tex_tate_)" : "PC (tex_yoko_)"}
          </div>
          <div className={styles.debugPatterns}>
            {availablePatterns.map((p) => {
              const active = p === effectivePattern;
              return (
                <button
                  key={p}
                  onClick={() => setPattern(p as Pattern)}
                  className={`${styles.debugButton} ${
                    active ? styles.active : ""
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <div className={styles.debugSection}>
            <div className={styles.debugSectionHeader}>
              <div className={styles.debugSectionTitle}>
                {isMobile ? "Bin / Cat (SP)" : "Bin / Cat (PC)"}
              </div>
              <button
                type="button"
                onClick={copyLayout}
                className={styles.debugCopyButton}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className={styles.debugRow}>
              <div className={styles.debugRowHeader}>
                <span>Bin height</span>
                <span className={styles.debugValue}>
                  {layout.binMaskH.toFixed(2)}vh
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={0.5}
                value={layout.binMaskH}
                onChange={
                  isMobile ? updateSp("binMaskH") : updatePc("binMaskH")
                }
              />
            </div>

            {isMobile ? (
              <div className={styles.debugRow}>
                <div className={styles.debugRowHeader}>
                  <span>Bin axis offset</span>
                  <span className={styles.debugValue}>
                    {spLayout.binAxisOffsetVw.toFixed(2)}vw
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={0.5}
                  value={spLayout.binAxisOffsetVw}
                  onChange={updateSp("binAxisOffsetVw")}
                />
              </div>
            ) : (
              <div className={styles.debugRow}>
                <div className={styles.debugRowHeader}>
                  <span>Bin right (× grid)</span>
                  <span className={styles.debugValue}>
                    {pcLayout.binRightGrid.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.05}
                  value={pcLayout.binRightGrid}
                  onChange={updatePc("binRightGrid")}
                />
              </div>
            )}

            <div className={styles.debugRow}>
              <div className={styles.debugRowHeader}>
                <span>Cat size (× bin h)</span>
                <span className={styles.debugValue}>
                  {layout.catSize.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.005}
                value={layout.catSize}
                onChange={isMobile ? updateSp("catSize") : updatePc("catSize")}
              />
            </div>

            <div className={styles.debugRow}>
              <div className={styles.debugRowHeader}>
                <span>Cat face X (× bin w)</span>
                <span className={styles.debugValue}>
                  {layout.catFaceX.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={-2}
                max={1.5}
                step={0.005}
                value={layout.catFaceX}
                onChange={
                  isMobile ? updateSp("catFaceX") : updatePc("catFaceX")
                }
              />
            </div>

            <div className={styles.debugRow}>
              <div className={styles.debugRowHeader}>
                <span>Cat face Y (× mask h)</span>
                <span className={styles.debugValue}>
                  {layout.catFaceY.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={-0.5}
                max={1.5}
                step={0.005}
                value={layout.catFaceY}
                onChange={
                  isMobile ? updateSp("catFaceY") : updatePc("catFaceY")
                }
              />
            </div>

            <div className={styles.debugValue} style={{marginTop: 6}}>
              cat: {catHvh.toFixed(2)}vh × {catWvh.toFixed(2)}vh
              <br />
              bottom: {catBottomVh.toFixed(2)}vh
              <br />
              {isMobile
                ? `left: calc(50vw + ${spLayout.binAxisOffsetVw.toFixed(
                    2,
                  )}vw + ${(
                    (spLayout.catFaceX - 0.5) * binWvh -
                    catWvh / 2
                  ).toFixed(2)}vh)`
                : `right: calc(grid×${pcLayout.binRightGrid.toFixed(2)} + ${(
                    binWvh * (1 - pcLayout.catFaceX) -
                    catWvh / 2
                  ).toFixed(2)}vh)`}
            </div>
          </div>

          <div className={styles.debugFootnote}>Ctrl+Shift+D to toggle</div>
        </div>
      )}
    </>
  );
}
