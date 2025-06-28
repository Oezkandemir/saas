import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native'
import { Text } from '../../components/ui/text'
import { Header } from '../../components/layout/header'
import { useTheme } from '../../lib/theme-context'
import { useAuth } from '../../lib/auth-context'
import { Users, UserPlus, Shield, Mail, Calendar, AlertCircle } from 'lucide-react-native'
import { getAllUsers, getUserStats, User, UserStats } from '../../lib/user-service'
import { formatDistanceToNow } from 'date-fns'

export default function UsersScreen() {
  const { colors } = useTheme()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      
      // Fetch users and stats in parallel
      const [usersResult, statsResult] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ])

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data)
      } else {
        setError(usersResult.error || 'Failed to fetch users')
      }

      if (statsResult.success && statsResult.data) {
        setUserStats(statsResult.data)
      } else {
        console.warn('Failed to fetch user stats:', statsResult.error)
        // Don't set error for stats failure, just use fallback values
        setUserStats({
          totalUsers: 0,
          recentSignUps: 0,
          adminUsers: 0,
          activeToday: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Check if current user is admin
  const isAdmin = currentUser?.user_metadata?.role === 'ADMIN'

  // Get recent users (first 10)
  const recentUsers = users.slice(0, 10)

  // Create stats array with real data
  const statsData = [
    { 
      title: 'Total Users', 
      value: userStats?.totalUsers?.toString() || '0', 
      icon: Users 
    },
    { 
      title: 'New This Week', 
      value: userStats?.recentSignUps?.toString() || '0', 
      icon: UserPlus 
    },
    { 
      title: 'Admin Users', 
      value: userStats?.adminUsers?.toString() || '0', 
      icon: Shield 
    },
  ]

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
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
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      alignItems: 'center',
    },
    statIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 2,
    },
    statTitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    usersList: {
      gap: 12,
    },
    userCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    userRole: {
      fontSize: 12,
      fontWeight: '500',
      color: '#3b82f6',
      backgroundColor: '#eff6ff',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    userDetails: {
      gap: 4,
    },
    userDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    userDetailText: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    comingSoon: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
    },
    comingSoonText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginTop: 12,
    },
    errorContainer: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.destructive,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    unauthorizedContainer: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
    },
    unauthorizedTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginTop: 16,
      marginBottom: 8,
    },
    unauthorizedText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
  })

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Users" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    )
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Users" showBackButton={true} />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.content}>
            <View style={styles.errorContainer}>
              <AlertCircle size={48} color={colors.destructive} />
              <Text style={styles.errorTitle}>Failed to load users</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchData}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // Show unauthorized state for non-admin users
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Header title="Users" showBackButton={true} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.unauthorizedContainer}>
              <Shield size={48} color={colors.mutedForeground} />
              <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
              <Text style={styles.unauthorizedText}>
                You need admin privileges to view user management features.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Users" showBackButton={true} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* User Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              {statsData.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <View key={index} style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                      <IconComponent size={16} color={colors.mutedForeground} />
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statTitle}>{stat.title}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Recent Users */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <View style={styles.usersList}>
              {recentUsers.map((user, index) => (
                <Pressable key={user.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
                    <Text style={styles.userRole}>{user.role}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <View style={styles.userDetail}>
                      <Mail size={14} color={colors.mutedForeground} />
                      <Text style={styles.userDetailText}>{user.email || 'No email'}</Text>
                    </View>
                    <View style={styles.userDetail}>
                      <Calendar size={14} color={colors.mutedForeground} />
                      <Text style={styles.userDetailText}>
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Management Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management Tools</Text>
            <View style={styles.comingSoon}>
              <Users size={48} color={colors.mutedForeground} />
              <Text style={styles.comingSoonText}>
                Advanced user management tools and bulk actions will be available soon.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
} 