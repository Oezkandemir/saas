# Push Notifications Setup Guide

This guide explains how to set up and use push notifications in the Cenety mobile app using Expo Notifications.

## 📋 Overview

The push notification system consists of:

1. **Client-side setup** - React Native app with Expo Notifications
2. **Database setup** - Supabase table for storing push tokens
3. **Server-side setup** - Backend functions to send push notifications
4. **User interface** - Settings screen for notification preferences

## 🚀 Quick Setup

### 1. Install Dependencies

Dependencies are already installed:

```bash
npm install expo-notifications expo-device
```

### 2. Configure app.json

The app.json is already configured with:

- Expo notifications plugin
- Required Android permissions
- Notification icon and sound configuration

### 3. Database Setup

Run the SQL script to create the push tokens table:

```sql
-- See: database/create-push-tokens-table.sql
-- This creates the user_push_tokens table with proper RLS policies
```

### 4. Initialize Services

The services are automatically initialized:

- `pushNotificationService` - Handles device registration and notifications
- `notificationService` - Manages in-app notifications (existing)

## 📱 Components

### NotificationSettings Component

Located at `components/notifications/notification-settings.tsx`

Features:

- ✅ Permission status display
- ✅ Push notification toggle
- ✅ Sound and vibration preferences
- ✅ Test notification functionality
- ✅ Clear all notifications
- ✅ Device token display

### Navigation Integration

Accessible via:

- Settings > Notifications
- Route: `/notification-settings`

## 🔧 Services

### PushNotificationService

Located at `lib/push-notification-service.ts`

Key methods:

- `initialize()` - Set up permissions and listeners
- `registerForPushNotifications()` - Get device token
- `sendLocalNotification()` - Send test notifications
- `getPermissionStatus()` - Check current permissions
- `clearAllNotifications()` - Clear notification center

### Integration with Existing NotificationService

The existing notification service (`lib/notification-service.ts`) handles:

- Real-time in-app notifications
- Notification count tracking
- Mark as read/delete functionality

Both services work together to provide a complete notification experience.

## 🗄️ Database Schema

### user_push_tokens Table

```sql
CREATE TABLE user_push_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    token TEXT NOT NULL,
    device_id TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android')),
    app_version TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, device_id)
);
```

**Features:**

- Row Level Security (RLS) enabled
- Automatic token updates per device
- Platform-specific storage
- Cascading deletes when user is removed

## 📤 Sending Push Notifications

### From Your Backend

To send push notifications from your backend:

```javascript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(userTokens, title, body, data = {}) {
  const messages = userTokens.map(token => ({
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  
  for (let chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log(receipts);
    } catch (error) {
      console.error(error);
    }
  }
}
```

### Integration with Supabase Functions

Create an Edge Function to send notifications when creating user notifications:

```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { user_id, title, body, data } = await req.json()
    
    // Get user's push tokens from database
    // Send push notification using Expo SDK
    // Return success response
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

## 🔔 Notification Types

### Local Notifications

For testing and immediate notifications:

```typescript
await pushNotificationService.sendLocalNotification(
  'Test Title',
  'Test message body',
  { customData: 'value' }
);
```

### Remote Push Notifications

Sent from your backend to user devices:

- Welcome notifications
- Newsletter updates
- System alerts
- User-specific notifications

## ⚙️ Configuration

### Notification Behavior

Configure in `lib/push-notification-service.ts`:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

### Deep Linking

Handle notification taps with navigation:

```typescript
// Automatically handled in pushNotificationService
// Customize in handleNotificationResponse method
```

## 🔐 Permissions

### iOS Permissions

Automatically requested when user enables notifications.

### Android Permissions

Added to app.json:

- `RECEIVE_BOOT_COMPLETED` - Handle notifications after device restart
- `VIBRATE` - Enable vibration for notifications

## 🧪 Testing

### Manual Testing

1. Go to Settings > Notifications
2. Enable push notifications
3. Tap "Send Test Notification"
4. Check notification center

### Debug Information

The notification settings screen shows:

- ✅ Permission status
- ✅ Device token (truncated)
- ✅ Test notification buttons
- ✅ Clear all functionality

## 🚨 Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Check device permissions in system settings
   - Verify push token is generated
   - Test with local notification first

2. **Permission denied**
   - Guide user to system settings
   - Show explanation of why notifications are needed

3. **Token not saving**
   - Check database connection
   - Verify user authentication
   - Check RLS policies

### Development vs Production

- **Development**: Uses Expo development builds
- **Production**: Requires EAS Build for proper push notifications
- **Testing**: Use local notifications for immediate testing

## 📈 Monitoring

### Track Notification Performance

Monitor in your analytics:

- Registration success rate
- Notification delivery rate
- User interaction with notifications
- Permission grant/deny rates

### Expo Push Receipt Service

Use Expo's receipt service to track:

- Delivery confirmations
- Failed deliveries
- Invalid tokens

## 🔄 Future Enhancements

Potential improvements:

- [ ] Notification categories (urgent, normal, low priority)
- [ ] Scheduled notifications
- [ ] Rich notifications with images
- [ ] Action buttons in notifications
- [ ] Notification analytics dashboard
- [ ] A/B testing for notification content

## 📞 Support

For issues or questions:

1. Check Expo Notifications documentation
2. Review this guide
3. Check the mobile app's console logs
4. Test with local notifications first

---

**Note**: Push notifications require physical devices for testing. They don't work in simulators/emulators.
