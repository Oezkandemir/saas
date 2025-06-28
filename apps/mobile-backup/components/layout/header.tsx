import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Pressable, Modal, Image, StatusBar, Platform } from 'react-native'
import { Text } from '../ui/text'
import { Badge } from '../ui/badge'
import { Avatar } from '../ui/avatar'
import { Bell, Sun, Moon, User, ChevronLeft, Home } from 'lucide-react-native'
import { useTheme } from '../../lib/theme-context'
import { useAuth } from '../../lib/auth-context'
import { NotificationBottomSheet } from './notification-bottom-sheet'
import { UserMenuBottomSheet } from './user-menu-bottom-sheet'
import { useNotificationCount } from '../../lib/hooks/use-notifications'
import { router } from 'expo-router'

interface HeaderProps {
  title: string
  showNotifications?: boolean
  showThemeToggle?: boolean
  showProfile?: boolean
  showLogo?: boolean
  showBackButton?: boolean
}

export function Header({ 
  title, 
  showNotifications = true, 
  showThemeToggle = true, 
  showProfile = true,
  showLogo = false,
  showBackButton = false
}: HeaderProps) {
  const { colors, theme, setTheme, isDark } = useTheme()
  const { user } = useAuth()
  const notificationCount = useNotificationCount()
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showUserMenuModal, setShowUserMenuModal] = useState(false)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)')
    }
  }

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 0,
      paddingVertical: Platform.OS === 'android' ? 20 : 12,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingTop: Platform.OS === 'android' ? 70 : 60,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      width: Platform.OS === 'android' ? 80 : 60,
      paddingLeft: Platform.OS === 'android' ? 20 : 16,
    },
    centerSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Platform.OS === 'android' ? 12 : 0,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Platform.OS === 'android' ? 12 : 8,
      width: Platform.OS === 'android' ? 140 : 120,
      justifyContent: 'flex-end',
      paddingRight: Platform.OS === 'android' ? 20 : 16,
    },
    logo: {
      width: 32,
      height: 32,
      backgroundColor: colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginTop: Platform.OS === 'android' ? 12 : 0,
    },
    iconButton: {
      padding: Platform.OS === 'android' ? 10 : 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
      marginHorizontal: Platform.OS === 'android' ? 2 : 0,
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.destructive,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.destructiveForeground,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarFallback: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
    },
  })

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.header}>
        {/* Left Section - Logo or Back Button */}
        <View style={styles.leftSection}>
          {showLogo ? (
            <View style={styles.logo}>
              <Home size={20} color={colors.primaryForeground} />
            </View>
          ) : showBackButton ? (
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <ChevronLeft size={20} color={colors.foreground} />
            </Pressable>
          ) : null}
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Right Section - Actions */}
        <View style={styles.rightSection}>
          {showNotifications && (
            <Pressable 
              style={styles.iconButton}
              onPress={() => setShowNotificationModal(true)}
            >
              <Bell size={20} color={colors.foreground} />
              {notificationCount.unread > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {notificationCount.unread > 9 ? '9+' : notificationCount.unread}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          {showThemeToggle && (
            <Pressable style={styles.iconButton} onPress={toggleTheme}>
              {isDark ? (
                <Sun size={20} color={colors.foreground} />
              ) : (
                <Moon size={20} color={colors.foreground} />
              )}
            </Pressable>
          )}

          {showProfile && (
            <Pressable 
              onPress={() => setShowUserMenuModal(true)}
            >
              <View style={styles.avatar}>
                {user?.user_metadata?.avatar_url && user.user_metadata.avatar_url !== 'null' ? (
                  <Image 
                    source={{ uri: user.user_metadata.avatar_url }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarFallback}>
                    {(user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Notification Modal */}
      {/* Notification Bottom Sheet */}
      <NotificationBottomSheet 
        isVisible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      {/* User Menu Bottom Sheet */}
      <UserMenuBottomSheet 
        isVisible={showUserMenuModal}
        onClose={() => setShowUserMenuModal(false)}
      />
    </>
  )
} 