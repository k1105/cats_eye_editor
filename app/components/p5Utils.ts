import type p5Type from "p5";

function loseWebGL(renderer: unknown) {
  try {
    const gl = (renderer as any)?.filterRenderer?.gl as WebGLRenderingContext | null;
    if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {}
}

/** p5.Graphics を WebGL コンテキストごと破棄する */
export function destroyGraphics(g: p5Type.Graphics | null | undefined) {
  if (!g) return;
  loseWebGL((g as any)._renderer);
  g.remove();
}

/** p5 インスタンスと内部の Graphics を WebGL コンテキストごと破棄する */
export function destroyP5(p: p5Type | null | undefined) {
  if (!p) return;
  loseWebGL((p as any)._renderer);
  // createGraphics で作られた要素も解放
  const elements: unknown[] = (p as any)._elements ?? [];
  for (const el of elements) {
    loseWebGL((el as any)._renderer ?? el);
  }
  p.remove();
}
