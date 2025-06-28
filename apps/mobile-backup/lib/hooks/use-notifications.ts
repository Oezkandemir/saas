import { useState, useEffect } from 'react'
import { notificationService, Notification, NotificationCount } from '../notification-service'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState<NotificationCount>({ total: 0, unread: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribeNotifications = notificationService.onNotificationsChange((newNotifications) => {
      setNotifications(newNotifications)
      setLoading(false)
    })

    // Subscribe to count updates
    const unsubscribeCount = notificationService.onNotificationCountChange((newCount) => {
      setCount(newCount)
    })

    return () => {
      unsubscribeNotifications()
      unsubscribeCount()
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    return await notificationService.markAsRead(notificationId)
  }

  const markAllAsRead = async () => {
    return await notificationService.markAllAsRead()
  }

  const deleteNotification = async (notificationId: string) => {
    return await notificationService.deleteNotification(notificationId)
  }

  const clearAll = async () => {
    return await notificationService.clearAllNotifications()
  }

  const refresh = async () => {
    setLoading(true)
    const freshNotifications = await notificationService.fetchNotifications()
    setNotifications(freshNotifications)
    const freshCount = await notificationService.getNotificationCount()
    setCount(freshCount)
    setLoading(false)
  }

  return {
    notifications,
    count,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  }
}

export function useNotificationCount() {
  const [count, setCount] = useState<NotificationCount>({ total: 0, unread: 0 })

  useEffect(() => {
    const unsubscribe = notificationService.onNotificationCountChange((newCount) => {
      setCount(newCount)
    })

    return unsubscribe
  }, [])

  return count
} 