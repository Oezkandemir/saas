import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  children?: React.ReactNode;
}

const Text = React.forwardRef<RNText, TextProps>(({ style, ...props }, ref) => {
  return <RNText ref={ref} style={style} {...props} />;
});

Text.displayName = 'Text';

export { Text };
export type { TextProps };
