import React from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { Text } from '../../components/ui/text'
import { Header } from '../../components/layout/header'
import { Separator } from '../../components/ui/separator'
import { useTheme } from '../../lib/theme-context'
import { useAuth } from '../../lib/auth-context'
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ArrowRight,
  Mail,
  Phone,
  Globe,
  Moon,
  Sun
} from 'lucide-react-native'
import { router } from 'expo-router'
import { Card } from '../../components/ui/card'
import { Settings as SettingsIcon } from 'lucide-react-native'

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace('/')
    } catch (error) {
      console.log('Error logging out:', error)
    }
  }

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { 
          title: 'Profile Settings', 
          description: 'Update your personal information',
          icon: User,
          action: () => router.push('/profile') 
        },
        { 
          title: 'Email & Notifications', 
          description: 'Manage your notification preferences',
          icon: Bell,
          action: () => router.push('/notification-settings') 
        },
        { 
          title: 'Privacy & Security', 
          description: 'Password and security settings',
          icon: Shield,
          action: () => console.log('Security') 
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          title: 'Help Center', 
          description: 'Get help and support',
          icon: HelpCircle,
          action: () => console.log('Help') 
        },
        { 
          title: 'Contact Support', 
          description: 'Get in touch with our team',
          icon: Mail,
          action: () => console.log('Contact') 
        },
        { 
          title: 'Terms & Privacy', 
          description: 'Legal information',
          icon: Globe,
          action: () => console.log('Terms') 
        },
      ]
    }
  ]

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
    },
    userSection: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 32,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
    },
    settingsGroup: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastSettingItem: {
      borderBottomWidth: 0,
    },
    settingIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    logoutSection: {
      marginTop: 32,
    },
    logoutButton: {
      backgroundColor: colors.destructive,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.destructiveForeground,
    },
    infoCard: {
      padding: 16,
      borderRadius: 12,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
    infoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
    },
  })

  const userInitials = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''

  return (
    <View style={styles.container}>
      <Header title="Settings" showBackButton={true} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          </View>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.settingsGroup}>
                {section.items.map((item, itemIndex) => {
                  const IconComponent = item.icon
                  const isLast = itemIndex === section.items.length - 1
                  
                  return (
                    <Pressable
                      key={itemIndex}
                      style={[
                        styles.settingItem,
                        isLast && styles.lastSettingItem
                      ]}
                      onPress={item.action}
                    >
                      <View style={styles.settingIconContainer}>
                        <IconComponent size={20} color={colors.mutedForeground} />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>{item.title}</Text>
                        <Text style={styles.settingDescription}>{item.description}</Text>
                      </View>
                      <ArrowRight size={16} color={colors.mutedForeground} />
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color={colors.destructiveForeground} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </View>

          {/* App Information */}
          <Card style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <SettingsIcon size={20} color={colors.foreground} />
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                App Information
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Version
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                1.0.0
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Build
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                1000
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  )
} 