import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface for push notification request
interface PushNotificationRequest {
  user_id: string
  notification_id: string
  title: string
  body: string
  data?: Record<string, any>
}

// Interface for push token from database
interface PushToken {
  token: string
  platform: string
  device_id: string
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const requestData: PushNotificationRequest = await req.json()
    const { user_id, notification_id, title, body, data = {} } = requestData

    // Validate required fields
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: user_id, title, body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's push tokens from database
    const { data: pushTokens, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('token, platform, device_id')
      .eq('user_id', user_id)

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch push tokens' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If no push tokens found, return success (user hasn't enabled push notifications)
    if (!pushTokens || pushTokens.length === 0) {
      console.log(`No push tokens found for user ${user_id}`)
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No push tokens found for user',
        sent_count: 0
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Prepare Expo push messages
    const messages = pushTokens.map((tokenData: PushToken) => ({
      to: tokenData.token,
      sound: 'default',
      title: title,
      body: body,
      data: {
        notification_id,
        action_url: data.action_url || null,
        ...data
      },
      priority: 'normal',
      channelId: 'default',
    }))

    console.log(`Sending ${messages.length} push notifications for user ${user_id}`)

    // Send push notifications using Expo's push service
    const expoPushUrl = 'https://exp.host/--/api/v2/push/send'
    
    const response = await fetch(expoPushUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Expo push service error:', responseData)
      return new Response(JSON.stringify({ 
        error: 'Failed to send push notifications',
        details: responseData
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('Push notifications sent successfully:', responseData)

    // Log any individual message failures
    if (responseData.data) {
      responseData.data.forEach((receipt: any, index: number) => {
        if (receipt.status === 'error') {
          console.error(`Push notification failed for token ${messages[index].to}:`, receipt)
        }
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Push notifications sent successfully',
      sent_count: messages.length,
      results: responseData.data
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in push notification function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

/* 
Usage Example:

POST /functions/v1/send-push-notification
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "notification_id": "123e4567-e89b-12d3-a456-426614174001", 
  "title": "Newsletter Subscription",
  "body": "Thank you for subscribing to our newsletter!",
  "data": {
    "action_url": "/dashboard/notifications",
    "type": "newsletter"
  }
}
*/ 