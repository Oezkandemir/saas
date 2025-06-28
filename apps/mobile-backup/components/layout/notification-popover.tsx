import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Pressable, ScrollView, Dimensions, SafeAreaView, StatusBar } from 'react-native'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { X, Trash2, Check } from 'lucide-react-native'
import { useTheme } from '../../lib/theme-context'
import { useNotifications } from '../../lib/hooks/use-notifications'

interface NotificationPopoverProps {
  onClose: () => void
}

export function NotificationPopover({ onClose }: NotificationPopoverProps) {
  const { colors, isDark } = useTheme()
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications()

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WELCOME':
        return '#3b82f6'
      case 'NEWSLETTER':
        return '#10b981'
      case 'SYSTEM':
        return '#f59e0b'
      case 'UPDATE':
        return '#8b5cf6'
      default:
        return colors.muted
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    closeButton: {
      padding: 4,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 12,
      color: colors.foreground,
      fontWeight: '500',
    },
    notificationsList: {
      flex: 1, // Vollbild-Scrolling
    },
    notificationItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      flex: 1,
      marginRight: 8,
    },
    notificationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    notificationButton: {
      padding: 4,
    },
    notificationContent: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 8,
      lineHeight: 16,
    },
    notificationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    notificationDate: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    notificationTypeTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },
    notificationTypeText: {
      fontSize: 10,
      fontWeight: '500',
      color: '#fff',
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
  })

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.popover} onPress={(e) => e.stopPropagation()}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Actions */}
        {notifications.length > 0 && (
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={markAllAsRead}>
              <Text style={styles.actionButtonText}>Mark all read</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={clearAll}>
              <Text style={styles.actionButtonText}>Clear all</Text>
            </Pressable>
          </View>
        )}

        {/* Notifications List */}
        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <View style={styles.notificationActions}>
                    {!notification.read && (
                      <Pressable 
                        style={styles.notificationButton}
                        onPress={() => markAsRead(notification.id)}
                      >
                        <Check size={16} color={colors.mutedForeground} />
                      </Pressable>
                    )}
                    <Pressable 
                      style={styles.notificationButton}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </View>
                
                <Text style={styles.notificationContent}>
                  {notification.content}
                </Text>
                
                <View style={styles.notificationFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.notificationTypeTag, { backgroundColor: getTypeColor(notification.type) }]}>
                      <Text style={styles.notificationTypeText}>
                        {notification.type.toLowerCase()}
                      </Text>
                    </View>
                    <Text style={styles.notificationDate}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Pressable>
    </Pressable>
  )
} 