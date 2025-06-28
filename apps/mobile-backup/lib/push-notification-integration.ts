/**
 * Push Notification Integration Utility
 * 
 * This utility provides functions to send push notifications when user notifications
 * are created in the web app. It can be called from server actions or other backend code.
 */

interface PushNotificationData {
  user_id: string
  notification_id?: string
  title: string
  body: string
  action_url?: string
  type?: string
  metadata?: Record<string, any>
}

/**
 * Send push notification using Supabase Edge Function
 * Call this function whenever you create a user notification
 */
export async function sendPushNotification(data: PushNotificationData): Promise<boolean> {
  try {
    // Get Supabase URL from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/send-push-notification`
    
    // Get service role key for server-side requests
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables for push notifications')
      return false
    }

    const payload = {
      user_id: data.user_id,
      notification_id: data.notification_id || '',
      title: data.title,
      body: data.body,
      data: {
        action_url: data.action_url,
        type: data.type,
        ...data.metadata
      }
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Push notification failed:', response.status, errorData)
      return false
    }

    const result = await response.json()
    console.log('Push notification sent successfully:', result)
    return true

  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

/**
 * Send push notification after creating a user notification in database
 * This is a helper function that combines notification creation with push sending
 */
export async function createNotificationWithPush(
  supabase: any,
  notificationData: {
    user_id: string
    title: string
    content: string
    type: string
    action_url?: string
    metadata?: Record<string, any>
  }
): Promise<{ success: boolean; notification_id?: string; error?: string }> {
  try {
    // First, create the notification in the database
    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: notificationData.user_id,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type,
        action_url: notificationData.action_url,
        read: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message }
    }

    // Then send the push notification
    const pushSent = await sendPushNotification({
      user_id: notificationData.user_id,
      notification_id: notification.id,
      title: notificationData.title,
      body: notificationData.content,
      action_url: notificationData.action_url,
      type: notificationData.type,
      metadata: notificationData.metadata
    })

    if (!pushSent) {
      console.warn('Push notification failed, but user notification was created')
    }

    return { 
      success: true, 
      notification_id: notification.id 
    }

  } catch (error) {
    console.error('Error in createNotificationWithPush:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Batch send push notifications to multiple users
 */
export async function sendBulkPushNotifications(
  notifications: PushNotificationData[]
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // Send notifications in parallel but limit concurrency
  const BATCH_SIZE = 5
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE)
    
    const results = await Promise.allSettled(
      batch.map(notification => sendPushNotification(notification))
    )

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        success++
      } else {
        failed++
      }
    })
  }

  return { success, failed }
}

/**
 * Example usage in your web app server actions:
 * 
 * ```typescript
 * import { createNotificationWithPush } from '@/lib/push-notification-integration'
 * 
 * // In your newsletter subscription action:
 * await createNotificationWithPush(supabase, {
 *   user_id: userId,
 *   title: "Newsletter Subscription",
 *   content: "Thank you for subscribing to our newsletter!",
 *   type: "NEWSLETTER",
 *   action_url: "/dashboard/notifications"
 * })
 * ```
 */ 