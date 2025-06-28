# 🚀 Complete Push Notifications Setup Guide

This guide explains exactly what you need to do to get push notifications working when user notifications are created in your web app.

## 🔧 Current Issue

You noticed that:
1. ✅ **In-app notifications work** (bell count shows up in mobile app)
2. ❌ **Push notifications don't work** (no notifications on device when app is closed)
3. ❌ **Role changes in web app** create notifications but no push notifications

**Why?** The push notification system is set up on the mobile side, but not connected to your backend.

## 🛠️ Required Setup Steps

### Step 1: Create Database Tables

Run these SQL scripts in your Supabase SQL editor:

```sql
-- 1. Create push tokens table (already provided)
-- Run: apps/mobile/database/create-push-tokens-table.sql

-- 2. Create push notification logs table
-- Run: apps/mobile/database/push-notification-trigger.sql
```

### Step 2: Deploy Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
# In your project root
supabase link --project-ref YOUR_PROJECT_ID
```

4. **Deploy the push notification function**:
```bash
# Copy the edge function to your web app
cp apps/mobile/supabase/functions/send-push-notification/index.ts apps/web/supabase/functions/send-push-notification/index.ts

# Deploy the function
cd apps/web
supabase functions deploy send-push-notification
```

### Step 3: Integrate with Existing Notification Code

Update your existing notification creation code to also send push notifications:

#### Option A: Modify Newsletter Action (Example)

Update `apps/web/actions/newsletter.ts`:

```typescript
// Add this import at the top
import { sendPushNotification } from '@/lib/push-notification-integration'

// Replace the existing notification creation code with:
const { data: notificationData, error: notificationError } =
  await supabase
    .from("user_notifications")
    .insert({
      user_id: userId,
      title: "Newsletter Subscription",
      content: notificationContent,
      type: "NEWSLETTER",
      read: false,
    })
    .select()

if (!notificationError && notificationData?.[0]) {
  // Send push notification
  await sendPushNotification({
    user_id: userId,
    notification_id: notificationData[0].id,
    title: "Newsletter Subscription",
    body: notificationContent,
    action_url: "/dashboard/notifications",
    type: "NEWSLETTER"
  })
}
```

#### Option B: Add to User Profile Actions

Update `apps/web/actions/user-profile-actions.ts`:

Add this function for creating notifications with push:

```typescript
import { sendPushNotification } from '@/lib/push-notification-integration'

// Add this new function
export async function createUserNotificationWithPush(
  userId: string,
  title: string,
  content: string,
  type: string,
  actionUrl?: string
): Promise<ActionResult<string>> {
  const supabase = await createClient()

  try {
    // Create notification
    const { data: notification, error } = await supabase
      .from("user_notifications")
      .insert({
        user_id: userId,
        title,
        content,
        type,
        action_url: actionUrl,
        read: false,
      })
      .select('id')
      .single()

    if (error) throw error

    // Send push notification
    await sendPushNotification({
      user_id: userId,
      notification_id: notification.id,
      title,
      body: content,
      action_url: actionUrl,
      type
    })

    return { success: true, data: notification.id }
  } catch (error) {
    console.error('Error creating notification with push:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}
```

### Step 4: Copy Integration Utility to Web App

Copy the integration utility to your web app:

```bash
cp apps/mobile/lib/push-notification-integration.ts apps/web/lib/push-notification-integration.ts
```

### Step 5: Update Environment Variables

Add to your web app's `.env.local`:

```env
# Your existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Add this for server-side push notifications
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 Testing the Integration

### 1. Test Mobile App Setup

1. **Open mobile app** and go to Settings → Notifications
2. **Enable push notifications** (grant permission)
3. **Send test notification** to verify local notifications work
4. **Check debug tool** to see device token and permission status

### 2. Test Backend Integration

1. **Subscribe to newsletter** on web app (or trigger any notification)
2. **Check if push notification appears** on your device
3. **Check Supabase logs** for edge function execution
4. **Check mobile app** for in-app notification

### 3. Test Role Changes

When you change user roles in the web app, make sure the code that creates the notification also calls the push notification function.

## 🔍 Debugging

### Check Edge Function Logs

```bash
# View edge function logs
supabase functions logs send-push-notification --follow
```

### Check Database

```sql
-- Check if push tokens are stored
SELECT * FROM user_push_tokens WHERE user_id = 'YOUR_USER_ID';

-- Check push notification logs
SELECT * FROM push_notification_logs ORDER BY created_at DESC LIMIT 10;
```

### Check Mobile App Debug Tool

Use the debug screen in your mobile app:
- Settings → Notifications → Open Debug Tool
- Check device info, permissions, and logs

## 🎯 Key Points

1. **Physical Device Required**: Push notifications only work on real devices, not simulators
2. **Permission Required**: Users must grant notification permission first
3. **Two-Part System**: In-app notifications (real-time) + Push notifications (when app is closed)
4. **Async Process**: Push notifications are sent asynchronously and won't block notification creation

## 🔄 Integration Checklist

- [ ] Database tables created (push tokens + logs)
- [ ] Edge function deployed
- [ ] Integration utility copied to web app
- [ ] Environment variables set
- [ ] Existing notification code updated
- [ ] Mobile app permissions granted
- [ ] Test notifications working
- [ ] Push notifications working

## 📱 Expected User Experience

1. **User enables push notifications** in mobile app settings
2. **Device token is stored** in database
3. **Web app creates notification** (role change, newsletter, etc.)
4. **Push notification is sent** to all user's devices
5. **User receives notification** even when app is closed
6. **Tapping notification** opens app and marks as read

## ❗ Common Issues

1. **No permission dialog**: Using simulator instead of physical device
2. **Notifications not sending**: Edge function not deployed or environment variables missing
3. **Push tokens not stored**: Database table not created or user didn't grant permission
4. **Function errors**: Check Supabase function logs for debugging

---

Once you complete these steps, push notifications will work automatically whenever user notifications are created in your web app! 🎉 