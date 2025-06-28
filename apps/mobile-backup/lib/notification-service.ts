import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { pushNotificationService } from './push-notification-service'

export interface Notification {
  id: string
  user_id: string
  title: string
  content: string
  type: 'WELCOME' | 'NEWSLETTER' | 'SYSTEM' | 'UPDATE'
  read: boolean
  created_at: string
  action_url?: string | null
  metadata?: any
}

export interface NotificationCount {
  total: number
  unread: number
}

class NotificationService {
  private realtimeChannel: RealtimeChannel | null = null
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private countListeners: Set<(count: NotificationCount) => void> = new Set()

  /**
   * Fetch all notifications for the current user
   */
  async fetchNotifications(): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user found')
        return []
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
      return []
    }
  }

  /**
   * Get notification count (total and unread)
   */
  async getNotificationCount(): Promise<NotificationCount> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { total: 0, unread: 0 }
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, read')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching notification count:', error)
        return { total: 0, unread: 0 }
      }

      const total = data?.length || 0
      const unread = data?.filter(n => !n.read)?.length || 0

      return { total, unread }
    } catch (error) {
      console.error('Error in getNotificationCount:', error)
      return { total: 0, unread: 0 }
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      // Refresh listeners
      this.notifyListeners()
      this.notifyCountListeners()
      return true
    } catch (error) {
      console.error('Error in markAsRead:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      // Refresh listeners
      this.notifyListeners()
      this.notifyCountListeners()
      return true
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      return false
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return false
      }

      // Refresh listeners
      this.notifyListeners()
      this.notifyCountListeners()
      return true
    } catch (error) {
      console.error('Error in deleteNotification:', error)
      return false
    }
  }

  /**
   * Clear all notifications for the current user
   */
  async clearAllNotifications(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing all notifications:', error)
        return false
      }

      // Refresh listeners
      this.notifyListeners()
      this.notifyCountListeners()
      return true
    } catch (error) {
      console.error('Error in clearAllNotifications:', error)
      return false
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  async subscribeToNotifications(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user, skipping real-time subscription')
        return
      }

      // Clean up existing subscription
      this.unsubscribeFromNotifications()

      console.log('Setting up real-time notification subscription for user:', user.id)

      this.realtimeChannel = supabase
        .channel('user_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Received notification change:', payload)
            // Refresh all listeners when data changes
            this.notifyListeners()
            this.notifyCountListeners()
          }
        )
        .subscribe((status) => {
          console.log('Notification subscription status:', status)
        })
    } catch (error) {
      console.error('Error subscribing to notifications:', error)
    }
  }

  /**
   * Unsubscribe from real-time notification updates
   */
  unsubscribeFromNotifications(): void {
    if (this.realtimeChannel) {
      console.log('Unsubscribing from notification updates')
      supabase.removeChannel(this.realtimeChannel)
      this.realtimeChannel = null
    }
  }

  /**
   * Subscribe to notification updates
   */
  onNotificationsChange(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback)
    
    // Immediately fetch and call with current data
    this.fetchNotifications().then(callback)
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Subscribe to notification count updates
   */
  onNotificationCountChange(callback: (count: NotificationCount) => void): () => void {
    this.countListeners.add(callback)
    
    // Immediately fetch and call with current data
    this.getNotificationCount().then(callback)
    
    return () => {
      this.countListeners.delete(callback)
    }
  }

  /**
   * Notify all notification listeners
   */
  private async notifyListeners(): Promise<void> {
    if (this.listeners.size > 0) {
      const notifications = await this.fetchNotifications()
      this.listeners.forEach(callback => callback(notifications))
    }
  }

  /**
   * Notify all count listeners
   */
  private async notifyCountListeners(): Promise<void> {
    if (this.countListeners.size > 0) {
      const count = await this.getNotificationCount()
      this.countListeners.forEach(callback => callback(count))
    }
  }

  /**
   * Initialize the service (subscribe to real-time updates and push notifications)
   */
  async initialize(): Promise<void> {
    await this.subscribeToNotifications()
    // Initialize push notifications service for device registration
    // This will handle permission requests and token registration
  }

  /**
   * Cleanup the service
   */
  cleanup(): void {
    this.unsubscribeFromNotifications()
    this.listeners.clear()
    this.countListeners.clear()
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Auto-initialize when imported
notificationService.initialize() 