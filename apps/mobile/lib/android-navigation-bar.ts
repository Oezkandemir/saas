import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';

export async function setAndroidNavigationBar(theme: 'light' | 'dark') {
  if (Platform.OS !== 'android') return;
  
  try {
    await NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');
    // Skip setBackgroundColorAsync when edge-to-edge is enabled to avoid warnings
    // The system will handle the background color automatically
  } catch (error) {
    console.warn('Failed to set Android navigation bar style:', error);
  }
}
