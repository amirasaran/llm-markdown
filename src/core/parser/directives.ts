/**
 * Directive attribute parser for strings like `type=bar title="Revenue" stacked`.
 * Returns a flat record of string | number | boolean.
 */
export function parseAttributes(input: string): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  const re = /([a-zA-Z_][\w-]*)(?:=("([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const key = m[1]!;
    const raw = m[3] ?? m[4] ?? m[5];
    if (raw === undefined) {
      out[key] = true;
      continue;
    }
    if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
      out[key] = Number(raw);
    } else if (raw === 'true' || raw === 'false') {
      out[key] = raw === 'true';
    } else {
      out[key] = raw;
    }
  }
  return out;
}

/** Matches a block directive opener: `:::name{attrs}` */
export const BLOCK_DIRECTIVE_OPEN = /^:::([a-zA-Z][\w-]*)(?:\{([^}]*)\})?\s*$/;
export const BLOCK_DIRECTIVE_CLOSE = /^:::\s*$/;

/** Matches an inline directive: `:name[label]{attrs}` — label and attrs optional. */
export const INLINE_DIRECTIVE = /:([a-zA-Z][\w-]*)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?/;

/** Directives whose body is opaque (not re-parsed as markdown). */
export const OPAQUE_BODY_DIRECTIVES = new Set(['chart', 'canvas', 'mermaid', 'math']);

export function isOpaqueDirective(name: string): boolean {
  return OPAQUE_BODY_DIRECTIVES.has(name);
}
