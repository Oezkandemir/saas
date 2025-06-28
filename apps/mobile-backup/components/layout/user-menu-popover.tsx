import React from 'react'
import { View, StyleSheet, Pressable, ScrollView, Dimensions, Image, SafeAreaView, StatusBar } from 'react-native'
import { Text } from '../ui/text'
import { Separator } from '../ui/separator'
import { router } from 'expo-router'
import { 
  User, 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  Shield, 
  X 
} from 'lucide-react-native'
import { useTheme } from '../../lib/theme-context'
import { useAuth } from '../../lib/auth-context'

interface UserMenuPopoverProps {
  onClose: () => void
}

export function UserMenuPopover({ onClose }: UserMenuPopoverProps) {
  const { colors, isDark } = useTheme()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      onClose()
      router.replace('/')
    } catch (error) {
      console.log('Error logging out:', error)
    }
  }

  const handleNavigation = (route: string) => {
    onClose()
    if (route === '/profile') {
      router.push('/profile')
    } else if (route === '/admin') {
      // TODO: Create admin screen  
      console.log('Navigate to admin')
    } else {
      router.push(route as any)
    }
  }

  // Get user info
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userRole = user?.user_metadata?.role || 'USER'
  const avatarUrl = user?.user_metadata?.avatar_url || null

  // Menu items based on user role
  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: User,
      route: '/profile',
      show: true,
    },
    {
      id: 'dashboard',
      title: 'Dashboard', 
      icon: LayoutDashboard,
      route: '/(tabs)',
      show: true,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      route: '/(tabs)/settings',
      show: true,
    },
    {
      id: 'admin',
      title: 'Admin',
      icon: Shield,
      route: '/admin',
      show: userRole === 'ADMIN',
    },
  ].filter(item => item.show)

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparenter Overlay
      justifyContent: 'flex-end', // Popover von unten
    },
    popover: {
      maxHeight: Dimensions.get('window').height - 100, // Begrenzte Höhe, Header bleibt sichtbar
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: 4,
      zIndex: 10,
    },
    userInfo: {
      alignItems: 'flex-start',
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarFallback: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    userRole: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    menuList: {
      flex: 1,
      paddingVertical: 8,
      paddingBottom: 100, // Platz für fixierten Logout-Button
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    menuItemPressed: {
      backgroundColor: colors.accent,
    },
    menuIcon: {
      // Icon styling handled inline
    },
    menuTitle: {
      fontSize: 14,
      color: colors.foreground,
      flex: 1,
    },
    logoutSection: {
      position: 'absolute', // Fixiert am unteren Rand
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: 20, // Extra Padding für safe area
    },
    logoutItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
      backgroundColor: '#dc2626', // Roter Hintergrund
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 12,
    },
    logoutItemPressed: {
      backgroundColor: '#b91c1c', // Dunkleres Rot wenn gedrückt
    },
    logoutTitle: {
      fontSize: 14,
      color: '#ffffff', // Weißer Text auf rotem Hintergrund
      fontWeight: '600',
      flex: 1,
    },
  })

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.popover} onPress={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={16} color={colors.mutedForeground} />
        </Pressable>

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
            <Text style={styles.userRole}>Role: {userRole}</Text>
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
                <IconComponent size={16} color={colors.foreground} />
                <Text style={styles.menuTitle}>{item.title}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutItem,
              pressed && styles.logoutItemPressed,
            ]}
            onPress={handleLogout}
          >
            <LogOut size={16} color="#ffffff" />
            <Text style={styles.logoutTitle}>Logout</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  )
} 