import { createContext, useContext, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { RendererContext } from '../../core/registry/componentRegistry';
import { Text } from '../rn';
import { LLMSelectableTextView, type SelectionEvent } from '../LLMSelectableTextView';

/** Returns the normalized `textSelection` config from context. */
export function useTextSelection() {
  const { textSelection } = useContext(RendererContext);
  return textSelection;
}

/** True when the current render is already nested inside a SelectableBlock.
 *  Per-block renderers (HeadingR, ParagraphR, TableCellR) consult this to
 *  avoid double-wrapping — the outer SelectableBlock already owns selection
 *  for the whole group, so inner blocks should render plain <Text> children. */
const InsideSelectableGroupContext = createContext(false);

export function useInsideSelectableGroup() {
  return useContext(InsideSelectableGroupContext);
}

/** Renders a block whose text content is user-selectable with the custom
 *  menu actions declared on `textSelection.actions`. Wraps children in the
 *  native `LLMSelectableTextView` (Fabric-registered in JS) so iOS UITextView
 *  / Android TextView selection machinery drives highlighting and menu. */
export function SelectableBlock({
  children,
  style,
}: {
  children?: ReactNode;
  style?: unknown;
}) {
  const sel = useTextSelection();
  const actions = sel.actions ?? [];
  const menuOptions = useMemo(() => actions.map((a) => a.label), [actions]);
  const handleSelection = useCallback(
    (event: SelectionEvent) => {
      const action = actions.find((a) => a.label === event.chosenOption);
      if (action) action.onPress(event.highlightedText);
      sel.onSelect?.(event.highlightedText);
    },
    [actions, sel]
  );

  return (
    <LLMSelectableTextView
      style={style as never}
      menuOptions={menuOptions}
      onSelection={handleSelection}
    >
      <InsideSelectableGroupContext.Provider value={true}>
        {children}
      </InsideSelectableGroupContext.Provider>
    </LLMSelectableTextView>
  );
}

/** Renders a string with text selection + optional custom menu items.
 *  Used for plain-text blocks (code blocks, table cells with string content). */
export function SelectableStringText({
  value,
  style,
}: {
  value: string;
  style?: unknown;
}) {
  return (
    <SelectableBlock style={style}>
      <Text style={style}>{value}</Text>
    </SelectableBlock>
  );
}
