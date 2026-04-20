/**
 * Font stacks used across the example app. Vazirmatn sits right after Inter
 * so that Persian / Arabic characters automatically fall through to it (the
 * browser picks the first font in the list that has a glyph for each code
 * point, so Latin → Inter, Persian/Arabic → Vazirmatn, and so on).
 *
 * JetBrains Mono for code is the monospaced counterpart.
 */
export const FONT_STACK =
  "'Inter', 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const MONO_STACK =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
