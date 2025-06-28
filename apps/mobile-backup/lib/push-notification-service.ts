import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface PushNotificationToken {
  token: string
  device_id: string
  platform: string
  app_version: string
}

class PushNotificationService {
  private pushToken: string | null = null
  private notificationListener: any = null
  private responseListener: any = null

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<void> {
    try {
      // Register for push notifications
      await this.registerForPushNotifications()
      
      // Set up notification listeners
      this.setupNotificationListeners()
      
      console.log('Push notification service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize push notification service:', error)
    }
  }

  /**
   * Register device for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices')
        return null
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications')
        return null
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '8c8b2a38-5c94-4f86-9a2e-1c4c5c6f8a7b', // Temporary project ID for dev builds
      })
      
      this.pushToken = tokenData.data
      console.log('Push token obtained:', this.pushToken)

      // Store token in database
      await this.storePushToken(this.pushToken)

      return this.pushToken
    } catch (error) {
      console.error('Error registering for push notifications:', error)
      return null
    }
  }

  /**
   * Store push token in database
   */
  private async storePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user to store push token')
        return
      }

             const deviceType = await Device.getDeviceTypeAsync()
       const appVersion = '1.0.0' // You can get this from app.json or expo-constants

       const tokenData: Partial<PushNotificationToken> = {
         token,
         device_id: `${Device.brand || 'unknown'}-${Device.modelName || 'unknown'}-${deviceType.toString()}`,
         platform: Platform.OS,
         app_version: appVersion,
       }

      // Store or update push token for this user
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          ...tokenData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_id'
        })

      if (error) {
        console.error('Error storing push token:', error)
      } else {
        console.log('Push token stored successfully')
      }
    } catch (error) {
      console.error('Error in storePushToken:', error)
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
      // You can handle the notification here (e.g., update local state)
    })

    // Listener for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response)
      this.handleNotificationResponse(response)
    })
  }

  /**
   * Handle notification response (when user taps notification)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const notification = response.notification
    const data = notification.request.content.data

    // Handle deep linking or navigation based on notification data
    if (data?.action_url) {
      // Navigate to specific screen based on action_url
      console.log('Navigate to:', data.action_url)
      // Implement your navigation logic here
    }

    if (data?.notification_id) {
      // Mark notification as read when user taps it
      this.markNotificationAsRead(data.notification_id)
    }
  }

  /**
   * Mark notification as read when user interacts with push notification
   */
  private async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
      }
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error)
    }
  }

        /**
    * Send a local notification (for testing)
    */
   async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
     try {
       await Notifications.scheduleNotificationAsync({
         content: {
           title,
           body,
           data,
         },
         trigger: null, // Immediate notification
       })
     } catch (error) {
       console.error('Error sending local notification:', error)
     }
   }

   /**
    * Get notification permissions status
    */
   async getPermissionStatus(): Promise<Notifications.NotificationPermissionsStatus> {
     return await Notifications.getPermissionsAsync()
   }

  /**
   * Clear all notifications from notification center
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync()
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener)
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener)
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Auto-initialize when imported
pushNotificationService.initialize() 