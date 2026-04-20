import { useEffect, useMemo, useRef } from 'react';
import { incrementalParse, type IncrementalState } from '../parser/incremental';
import { annotateDirection } from '../bidi/detect';
import type { RootNode, Direction } from '../parser/ast';

export interface UseStreamMarkdownOptions {
  streaming?: boolean;
  direction?: 'auto' | Direction;
}

export interface UseStreamMarkdownResult {
  tree: RootNode;
}

export function useStreamMarkdown(
  text: string,
  options: UseStreamMarkdownOptions = {}
): UseStreamMarkdownResult {
  const { streaming = true, direction = 'auto' } = options;
  const stateRef = useRef<IncrementalState | undefined>(undefined);

  const tree = useMemo(() => {
    const result = incrementalParse(text, streaming, stateRef.current);
    stateRef.current = result.state;
    const fallback: Direction = direction === 'rtl' ? 'rtl' : 'ltr';
    if (direction === 'auto') {
      annotateDirection(result.tree, 'ltr');
    } else {
      annotateDirection(result.tree, fallback);
    }
    return result.tree;
  }, [text, streaming, direction]);

  useEffect(() => {
    return () => {
      stateRef.current = undefined;
    };
  }, []);

  return { tree };
}
