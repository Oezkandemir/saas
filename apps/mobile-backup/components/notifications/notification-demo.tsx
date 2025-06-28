import React from 'react'
import { View, StyleSheet, Pressable, Alert } from 'react-native'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { useTheme } from '../../lib/theme-context'
import { useNotifications } from '../../lib/hooks/use-notifications'
import { supabase } from '../../lib/supabase'

export function NotificationDemo() {
  const { colors } = useTheme()
  const { notifications, count, loading, refresh } = useNotifications()

  const createTestNotification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'Please log in first')
        return
      }

      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: user.id,
          title: 'Test Notification',
          content: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
          type: 'SYSTEM',
          read: false,
        })

      if (error) {
        console.error('Error creating notification:', error)
        Alert.alert('Error', 'Failed to create notification')
      } else {
        Alert.alert('Success', 'Test notification created!')
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    }
  }

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 8,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 6,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    button: {
      marginTop: 8,
    },
    recentTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      marginTop: 16,
      marginBottom: 8,
    },
    notificationItem: {
      padding: 8,
      backgroundColor: colors.muted,
      borderRadius: 4,
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.foreground,
    },
    notificationContent: {
      fontSize: 10,
      color: colors.mutedForeground,
      marginTop: 2,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notification System Demo</Text>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{count.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{count.unread}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Loaded</Text>
        </View>
      </View>

      <Button
        onPress={createTestNotification}
        style={styles.button}
      >
        <Text>Create Test Notification</Text>
      </Button>

      <Button
        onPress={refresh}
        style={styles.button}
        variant="outline"
      >
        <Text>Refresh Notifications</Text>
      </Button>

      {loading ? (
        <Text style={styles.recentTitle}>Loading notifications...</Text>
      ) : (
        <>
          <Text style={styles.recentTitle}>
            Recent Notifications ({notifications.length})
          </Text>
          {notifications.slice(0, 3).map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>
                {notification.title}
              </Text>
              <Text style={styles.notificationContent}>
                {notification.content}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  )
} 