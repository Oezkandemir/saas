import React from 'react';
import { View, Pressable, Image, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { DeprecatedUi } from '@rnr/reusables';
import { Text } from '~/components/ui/text';
import { Home } from '~/lib/icons/Home';
import { Bell } from '~/lib/icons/Bell';
import { Sun } from '~/lib/icons/Sun';
import { Moon } from '~/lib/icons/Moon';
import { ChevronLeft } from '~/lib/icons/ChevronLeft';
import { useAuth } from '~/lib/auth-context';
import { useColorScheme } from '~/lib/useColorScheme';
import { UserMenuBottomSheet } from '~/components/auth/UserMenuBottomSheet';
import { NotificationBottomSheet } from '~/components/layout/NotificationBottomSheet';
import { useNotificationCount } from '~/lib/notification-provider';
import { cn } from '~/lib/utils';

const {
  BottomSheet,
  BottomSheetOpenTrigger,
} = DeprecatedUi;

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
  showProfile?: boolean;
  showLogo?: boolean;
  showBackButton?: boolean;
}

export function AppHeader({ 
  title, 
  showNotifications = true, 
  showThemeToggle = true, 
  showProfile = true,
  showLogo = true,
  showBackButton = false
}: AppHeaderProps) {
  const { colors } = useTheme();
  const { user } = useAuth(); // User is always defined here since only authenticated users see this
  const { isDarkColorScheme, setColorScheme } = useColorScheme();
  const notificationCount = useNotificationCount();

  const toggleTheme = () => {
    const newTheme = isDarkColorScheme ? 'light' : 'dark';
    setColorScheme(newTheme);
  };

  const ThemeIcon = isDarkColorScheme ? Sun : Moon;

  return (
    <>
      <View className="bg-background">
        <View className={cn(
          'flex-row items-center justify-between',
          Platform.OS === 'android' ? 'pt-16 pb-4 px-5' : 'pt-14 pb-3 px-4'
        )}>
          {/* Left Section - Logo or Back Button */}
          <View className={cn(
            'flex-row items-center',
            Platform.OS === 'android' ? 'w-20' : 'w-16'
          )}>
            {showLogo ? (
              <View className={cn(
                "items-center justify-center w-8 h-8 rounded-lg",
                isDarkColorScheme ? "bg-white" : "bg-primary"
              )}>
                <Home size={20} color={isDarkColorScheme ? "#000" : "white"} />
              </View>
            ) : showBackButton ? (
              <Pressable 
                className="p-2 border rounded-lg bg-card border-border"
                onPress={() => router.back()}
              >
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>
            ) : null}
          </View>

          {/* Center Section - Title */}
          <View className="items-center justify-center flex-1 px-3">
            <Text className={cn(
              'text-lg font-semibold text-foreground text-center',
              Platform.OS === 'android' && 'mt-3'
            )}>
              {title}
            </Text>
          </View>

          {/* Right Section - Actions */}
          <View className={cn(
            'flex-row items-center justify-end',
            Platform.OS === 'android' ? 'w-36 gap-3' : 'w-32 gap-2'
          )}>
            {showNotifications && (
              <NotificationBottomSheet>
                <BottomSheetOpenTrigger asChild>
                  <Pressable className={cn(
                    'relative bg-card rounded-lg border border-border',
                    Platform.OS === 'android' ? 'p-2.5' : 'p-2'
                  )}>
                    <Bell size={20} color={colors.text} />
                    {/* Notification Badge */}
                    {notificationCount.unread > 0 && (
                      <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center">
                        <Text className="text-xs font-bold text-white">
                          {notificationCount.unread > 99 ? '99+' : notificationCount.unread}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </BottomSheetOpenTrigger>
              </NotificationBottomSheet>
            )}

            {showThemeToggle && (
              <Pressable 
                onPress={toggleTheme}
                className={cn(
                  'bg-card rounded-lg border border-border',
                  Platform.OS === 'android' ? 'p-2.5' : 'p-2'
                )}
              >
                <ThemeIcon size={20} color={colors.text} />
              </Pressable>
            )}

            {showProfile && user && (
              <UserMenuBottomSheet>
                <BottomSheetOpenTrigger asChild>
                  <Pressable>
                    <View className="items-center justify-center overflow-hidden rounded-full w-9 h-9 bg-muted">
                      {user.image ? (
                        <Image
                          source={{ uri: user.image }}
                          className='rounded-full w-9 h-9'
                          resizeMode='cover'
                        />
                      ) : (
                        <Text className="text-sm font-semibold text-foreground">
                          {(user.email?.[0] || 'U').toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </BottomSheetOpenTrigger>
              </UserMenuBottomSheet>
            )}
          </View>
        </View>
      </View>
      {/* Ultra-thin edge-to-edge border with proper dark/light mode colors */}
      <View 
        style={{
          height: 0.5,
          backgroundColor: isDarkColorScheme ? '#374151' : '#d1d5db', // gray-700 for dark, gray-300 for light
          width: '100%',
        }}
      />
    </>
  );
} 