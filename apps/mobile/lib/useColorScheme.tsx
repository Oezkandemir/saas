import { useColorScheme as useNativeColorScheme, Appearance } from 'react-native';
import * as React from 'react';

export function useColorScheme() {
  const nativeColorScheme = useNativeColorScheme();
  
  const setColorScheme = React.useCallback((colorScheme: 'light' | 'dark') => {
    // Use React Native's Appearance API instead of NativeWind's setColorScheme
    Appearance.setColorScheme(colorScheme);
  }, []);
  
  const toggleColorScheme = React.useCallback(() => {
    const newTheme = nativeColorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newTheme);
  }, [nativeColorScheme, setColorScheme]);

  return {
    colorScheme: nativeColorScheme ?? 'light',
    isDarkColorScheme: nativeColorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
  };
}
