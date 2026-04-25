import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

export type SelectionEvent = {
  chosenOption: string;
  highlightedText: string;
};

interface NativeProps extends ViewProps {
  menuOptions: readonly string[];
  onSelection?: DirectEventHandler<SelectionEvent>;
}

export default codegenNativeComponent<NativeProps>('LLMSelectableTextView');
