import { useTheme } from '@react-navigation/native';
import { Pressable, View, Platform } from 'react-native';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { Sun } from '~/lib/icons/Sun';
import { useColorScheme } from '~/lib/useColorScheme';

export function ThemeToggle() {
  const { isDarkColorScheme, setColorScheme } = useColorScheme();
  const { colors } = useTheme();

  // Platform-specific padding to match UserAvatarToggle
  const platformPadding = Platform.OS === 'android' ? 'pr-6' : 'pr-4';

  function toggleColorScheme() {
    const newTheme = isDarkColorScheme ? 'light' : 'dark';
    setColorScheme(newTheme);
    setAndroidNavigationBar(newTheme);
  }

  return (
    <Pressable
      onPress={toggleColorScheme}
      className='web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 active:opacity-70'
    >
      <View className={`w-16 h-12 items-center justify-center ${platformPadding}`}>
        <Sun 
          color={colors.text}
          size={24} 
          strokeWidth={1.5} 
        />
      </View>
    </Pressable>
  );
}
