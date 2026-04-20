import { parseMarkdown } from './tokenizer';
import { assignIds } from './ast';
import type { RootNode } from './ast';

export interface IncrementalState {
  lastSource: string;
  lastTree: RootNode;
}

/**
 * Streaming-safe re-parse.
 *
 * The parser is fast enough to re-run on each token batch; the real incremental
 * perf win comes from stable node ids (assignIds) + React.memo in renderers,
 * so unchanged subtrees never re-render even though we re-parse the text.
 *
 * If the new source is a prefix-extension of the last source, we still re-parse
 * from scratch (CommonMark block grammar isn't safely append-only — a new line
 * can change the classification of prior lines, e.g. a blank line promoting
 * a paragraph into a lazy continuation or a setext heading). Doing a full
 * re-parse keeps correctness; the diff stage keeps render cost low.
 */
export function incrementalParse(
  source: string,
  streaming: boolean,
  prev?: IncrementalState
): { tree: RootNode; state: IncrementalState } {
  if (prev && prev.lastSource === source) {
    return { tree: prev.lastTree, state: prev };
  }
  const tree = assignIds(parseMarkdown(source, { streaming }));
  return { tree, state: { lastSource: source, lastTree: tree } };
}
