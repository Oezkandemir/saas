import React, { useRef } from 'react'
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native'
import { Text } from '../ui/text'
import { router } from 'expo-router'
import { 
  User, 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  Shield 
} from 'lucide-react-native'
import { useTheme } from '../../lib/theme-context'
import { useAuth } from '../../lib/auth-context'
import { CustomBottomSheet } from '../ui/bottom-sheet'
import { BottomSheetModal } from '@gorhom/bottom-sheet'

interface UserMenuBottomSheetProps {
  isVisible: boolean
  onClose: () => void
}

export function UserMenuBottomSheet({ isVisible, onClose }: UserMenuBottomSheetProps) {
  const { colors } = useTheme()
  const { user, signOut } = useAuth()
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const userEmail = user?.email || ''
  const userRole = user?.user_metadata?.role || 'user'
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = user?.user_metadata?.avatar_url

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: User,
      route: '/profile'
    },
    {
      id: 'dashboard', 
      title: 'Dashboard',
      icon: LayoutDashboard,
      route: '/dashboard'
    },
    {
      id: 'settings',
      title: 'Settings', 
      icon: Settings,
      route: '/settings'
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      icon: Shield,
      route: '/admin',
      showIf: userRole === 'admin'
    }
  ].filter(item => !item.showIf || item.showIf === true)

  const handleNavigation = (route: string) => {
    onClose()
    router.push(route as any)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      onClose()
      router.replace('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    userInfo: {
      alignItems: 'center',
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    avatarFallback: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    userRole: {
      fontSize: 12,
      color: colors.mutedForeground,
      textTransform: 'capitalize',
    },
    menuList: {
      flex: 1,
      paddingVertical: 8,
      paddingBottom: 100, // Platz für fixierten Logout-Button
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 16,
    },
    menuItemPressed: {
      backgroundColor: colors.accent,
    },
    menuTitle: {
      fontSize: 16,
      color: colors.foreground,
      flex: 1,
    },
    logoutSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: 20,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 16,
      backgroundColor: '#dc2626', // Roter Hintergrund
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 12,
    },
    logoutButtonPressed: {
      backgroundColor: '#b91c1c', // Dunkleres Rot wenn gedrückt
    },
    logoutTitle: {
      fontSize: 16,
      color: '#ffffff', // Weißer Text
      fontWeight: '600',
      flex: 1,
    },
  })

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={['40%', '70%', '90%']}
    >
      <View style={styles.container}>
        {/* User Info Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {avatarUrl && avatarUrl !== 'null' && avatarUrl !== '' ? (
                <Image 
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarFallback}>
                  {displayName[0]?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
            <Text style={styles.userRole}>{userRole}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Pressable 
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => handleNavigation(item.route)}
              >
                <IconComponent size={20} color={colors.foreground} />
                <Text style={styles.menuTitle}>{item.title}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Fixed Logout Button */}
        <View style={styles.logoutSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ffffff" />
            <Text style={styles.logoutTitle}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </CustomBottomSheet>
  )
} 