import { useContext } from 'react';
import type { AnyNode } from './parser/ast';
import type { BlockStyleConfig, BlockStyles } from '../shared/types';
import { RendererContext } from './registry/componentRegistry';

export interface ResolvedBlockStyle {
  /** Consumer-supplied style object (or undefined). Apply after default styles. */
  style: Record<string, unknown> | undefined;
  /** Consumer-supplied className (web only). */
  className: string | undefined;
}

/** Resolve the style + className configured for the given node type. Supports
 *  both plain values and function form `(node) => value`. Safe to call from
 *  any renderer — returns `{ style: undefined, className: undefined }` when
 *  nothing is configured. */
export function useBlockStyle(node: AnyNode): ResolvedBlockStyle {
  const { blockStyles } = useContext(RendererContext);
  const cfg = (blockStyles as Record<string, BlockStyleConfig | undefined>)[node.type];
  if (!cfg) return EMPTY;
  const style = typeof cfg.style === 'function' ? cfg.style(node) : cfg.style;
  const className = typeof cfg.className === 'function' ? cfg.className(node) : cfg.className;
  return { style: style ?? undefined, className: className ?? undefined };
}

/** Non-hook variant: reads from the registry directly. Useful in places that
 *  can't call hooks (grouped inline rendering during selection). */
export function resolveBlockStyle(
  blockStyles: BlockStyles,
  node: AnyNode
): ResolvedBlockStyle {
  const cfg = (blockStyles as Record<string, BlockStyleConfig | undefined>)[node.type];
  if (!cfg) return EMPTY;
  const style = typeof cfg.style === 'function' ? cfg.style(node) : cfg.style;
  const className = typeof cfg.className === 'function' ? cfg.className(node) : cfg.className;
  return { style: style ?? undefined, className: className ?? undefined };
}

const EMPTY: ResolvedBlockStyle = { style: undefined, className: undefined };
