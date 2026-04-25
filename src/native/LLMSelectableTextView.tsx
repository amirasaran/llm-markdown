import * as React from 'react';
import { Platform, DeviceEventEmitter, findNodeHandle } from 'react-native';
import type {
  HostComponent,
  NativeSyntheticEvent,
  ViewProps,
} from 'react-native';
// Deep-import intentional: public API does not export the registry.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — no types exposed by react-native for this path.
import { get as registerNativeComponent } from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';

export type SelectionEvent = {
  chosenOption: string;
  highlightedText: string;
};

type NativeProps = ViewProps & {
  menuOptions: ReadonlyArray<string>;
  onSelection?: (e: NativeSyntheticEvent<SelectionEvent>) => void;
};

const COMPONENT_NAME = 'LLMSelectableTextView';

const NativeSelectableTextView: HostComponent<NativeProps> =
  registerNativeComponent(COMPONENT_NAME, () => ({
    uiViewClassName: COMPONENT_NAME,
    bubblingEventTypes: {},
    directEventTypes: {
      topSelection: { registrationName: 'onSelection' },
    },
    validAttributes: {
      menuOptions: true,
    },
  })) as HostComponent<NativeProps>;

export type LLMSelectableTextViewProps = {
  children?: React.ReactNode;
  menuOptions: ReadonlyArray<string>;
  onSelection?: (event: SelectionEvent) => void;
  style?: ViewProps['style'];
};

export function LLMSelectableTextView({
  children,
  menuOptions,
  onSelection,
  style,
}: LLMSelectableTextViewProps) {
  const viewRef = React.useRef<React.ElementRef<typeof NativeSelectableTextView> | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'android' || !onSelection) return;
    const sub = DeviceEventEmitter.addListener(
      'LLMSelectableTextSelection',
      (payload: { viewTag: number; chosenOption: string; highlightedText: string }) => {
        const tag = findNodeHandle(viewRef.current);
        if (tag === payload.viewTag) {
          onSelection({
            chosenOption: payload.chosenOption,
            highlightedText: payload.highlightedText,
          });
        }
      },
    );
    return () => sub.remove();
  }, [onSelection]);

  return (
    <NativeSelectableTextView
      ref={viewRef}
      style={style}
      menuOptions={menuOptions}
      onSelection={(e) => {
        if (onSelection) onSelection(e.nativeEvent);
      }}
    >
      {children}
    </NativeSelectableTextView>
  );
}
