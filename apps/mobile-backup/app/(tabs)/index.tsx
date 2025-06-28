import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../../components/ui/text'
import { Button } from '../../components/ui/button'
import { Header } from '../../components/layout/header'
import { UserAvatar } from '../../components/user-avatar'
import { 
  Settings, 
  Bell, 
  CreditCard, 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp,
  ArrowUpRight,
  User,
  Shield,
  LogOut,
  Plus,
  Activity
} from 'lucide-react-native'
import { useAuth } from '../../lib/auth-context'
import { useTheme } from '../../lib/theme-context'
import { getUserStats, UserStats } from '../../lib/user-service'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const { colors } = useTheme()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const result = await getUserStats()
      
      if (result.success && result.data) {
        setUserStats(result.data)
      } else {
        console.error('Error fetching user stats:', result.error)
        // Set fallback data
        setUserStats({
          totalUsers: 0,
          recentSignUps: 0,
          adminUsers: 0,
          activeToday: 0,
        })
      }
    } catch (error) {
      console.error('Exception fetching user stats:', error)
      // Set fallback data
      setUserStats({
        totalUsers: 0,
        recentSignUps: 0,
        adminUsers: 0,
        activeToday: 0,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchUserStats()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace('/')
    } catch (error) {
      console.log('Error logging out:', error)
    }
  }

  const stats = [
    { 
      title: 'Total Users', 
      value: userStats?.totalUsers?.toString() || '0', 
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'All registered users'
    },
    { 
      title: 'New Signups', 
      value: userStats?.recentSignUps?.toString() || '0', 
      change: '+12%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'Last 7 days'
    },
    { 
      title: 'Active Today', 
      value: userStats?.activeToday?.toString() || '0', 
      change: '+8%',
      changeType: 'positive' as const,
      icon: Activity,
      description: 'Users active today'
    },
    { 
      title: 'Projects', 
      value: '12', 
      change: '+3%',
      changeType: 'positive' as const,
      icon: Package,
      description: 'Active projects'
    },
  ]

  const quickActions = [
    { 
      title: 'View Analytics', 
      description: 'Track performance metrics', 
      icon: BarChart3,
      action: () => console.log('Analytics'),
      available: true
    },
    { 
      title: 'User Management', 
      description: 'Manage users and roles', 
      icon: Users,
      action: () => console.log('Users'),
      available: user?.user_metadata?.role === 'ADMIN'
    },
    { 
      title: 'Billing & Plans', 
      description: 'Manage subscription', 
      icon: CreditCard,
      action: () => router.push('/billing'),
      available: true
    },
    { 
      title: 'Create Project', 
      description: 'Start a new project', 
      icon: Plus,
      action: () => console.log('New Project'),
      available: true
    },
  ].filter(action => action.available)

  const userInitials = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const isAdmin = user?.user_metadata?.role === 'ADMIN'
  const memberSince = user?.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'Recently'

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    content: {
      padding: 24,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
    },
    userInfo: {
      flex: 1,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    adminBadge: {
      backgroundColor: '#eff6ff',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    userEmail: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 1,
    },
    memberSince: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 1,
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      width: '47%',
      minWidth: 140,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.mutedForeground,
    },
    statIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
    },
    statChange: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    statChangeText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#22c55e',
    },
    statDescription: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    actionsList: {
      gap: 12,
    },
    actionCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    actionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: '#eff6ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: 1,
    },
    actionDescription: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    accountActions: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    accountAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastAccountAction: {
      borderBottomWidth: 0,
    },
    accountActionText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.foreground,
    },
    logoutButton: {
      backgroundColor: colors.destructive,
      borderRadius: 8,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      flexDirection: 'row',
      gap: 8,
    },
    logoutButtonText: {
      color: colors.destructiveForeground,
      fontSize: 13,
      fontWeight: '500',
    },
  })

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Dashboard" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    )
  }

      return (
      <View style={styles.container}>
        <Header title="Dashboard" showBackButton={true} />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.userSection}>
            <UserAvatar user={user || undefined} size="medium" />
            
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{userName}</Text>
                {isAdmin && (
                  <View style={styles.adminBadge}>
                    <Shield size={10} color="#3b82f6" />
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{userEmail}</Text>
              <Text style={styles.memberSince}>Member {memberSince}</Text>
            </View>
          </View>

          {/* Overview Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <View key={index} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                      <View style={styles.statIconContainer}>
                        <IconComponent size={14} color={colors.mutedForeground} />
                      </View>
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <View style={styles.statChange}>
                        <Text style={styles.statChangeText}>{stat.change}</Text>
                        <ArrowUpRight size={10} color="#22c55e" />
                      </View>
                    </View>
                    <Text style={styles.statDescription}>{stat.description}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <Pressable 
                    key={index} 
                    style={styles.actionCard}
                    onPress={action.action}
                  >
                    <View style={styles.actionLeft}>
                      <View style={styles.actionIconContainer}>
                        <IconComponent size={18} color="#3b82f6" />
                      </View>
                      <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionDescription}>{action.description}</Text>
                      </View>
                    </View>
                    <ArrowUpRight size={14} color={colors.mutedForeground} />
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountActions}>
              <Pressable style={styles.accountAction}>
                <Text style={styles.accountActionText}>Profile Settings</Text>
                <ArrowUpRight size={14} color={colors.mutedForeground} />
              </Pressable>
              
              <Pressable style={styles.accountAction}>
                <Text style={styles.accountActionText}>Notifications</Text>
                <ArrowUpRight size={14} color={colors.mutedForeground} />
              </Pressable>
              
              <Pressable style={[styles.accountAction, styles.lastAccountAction]}>
                <Text style={styles.accountActionText}>Help & Support</Text>
                <ArrowUpRight size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Logout Button */}
          <Button
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <LogOut size={16} color={colors.destructiveForeground} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
