import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Theme, ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { DeprecatedUi } from '@rnr/reusables';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Appearance, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeToggle } from '~/components/ThemeToggle';
import { Text } from '~/components/ui/text';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { AuthProvider, useAuth } from '~/lib/auth-context';
import { NotificationProvider } from '~/lib/notification-provider';

const { ToastProvider } = DeprecatedUi;

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'welcome',
};

const usePlatformSpecificSetup = Platform.select({
  web: useSetWebBackgroundClassName,
  android: useSetAndroidNavigationBar,
  default: noop,
});

function AppContent() {
  const { user, loading } = useAuth();
  const [hasNavigated, setHasNavigated] = React.useState(false);

  // Handle routing based on auth state
  React.useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user && !hasNavigated) {
      // User is not authenticated - go to welcome
      router.replace('/welcome');
      setHasNavigated(true);
    } else if (user && !hasNavigated) {
      // User is authenticated - go to main app
      router.replace('/(tabs)');
      setHasNavigated(true);
    }
  }, [user, loading, hasNavigated]);

  // Reset navigation flag when auth state changes
  React.useEffect(() => {
    setHasNavigated(false);
  }, [user]);

  if (loading) {
    // Loading screen
    return null; // Could add a loading component here
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        // Unauthenticated - Show welcome/onboarding/signin flow
        <>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="signin" />
          <Stack.Screen name="signup" />
        </>
      ) : (
        // Authenticated - Show full app
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
              headerShown: true,
              headerTitle(props) {
                return <Text className='text-xl font-semibold'>{toOptions(props.children)}</Text>;
              },
              headerRight: () => <ThemeToggle />,
            }}
          />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const { isDarkColorScheme } = useColorScheme();

  usePlatformSpecificSetup();

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <AppContent />
            </BottomSheetModalProvider>
            <PortalHost />
          </GestureHandlerRootView>
          <ToastProvider />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

function toOptions(name: string) {
  const title = name
    .split('-')
    .map(function (str: string) {
      return str.replace(/\b\w/g, function (char) {
        return char.toUpperCase();
      });
    })
    .join(' ');
  return title;
}

const useIsomorphicLayoutEffect =
  Platform.OS === 'web' && typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function useSetWebBackgroundClassName() {
  useIsomorphicLayoutEffect(() => {
    // Adds the background color to the html element to prevent white background on overscroll.
    document.documentElement.classList.add('bg-background');
  }, []);
}

function useSetAndroidNavigationBar() {
  React.useLayoutEffect(() => {
    setAndroidNavigationBar(Appearance.getColorScheme() ?? 'light');
  }, []);
}

function noop() {}
