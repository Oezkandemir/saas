-- Create a trigger function that calls the push notification edge function
-- whenever a new user notification is inserted

CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  push_payload JSONB;
  function_url TEXT;
BEGIN
  -- Only trigger for new notifications that are unread
  IF NEW.read = false THEN
    
    -- Prepare the payload for the push notification function
    push_payload := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'notification_id', NEW.id::text,
      'title', NEW.title,
      'body', NEW.content,
      'data', jsonb_build_object(
        'action_url', NEW.action_url,
        'type', NEW.type,
        'created_at', NEW.created_at
      )
    );

    -- Get the Supabase project URL from environment
    -- You'll need to replace this with your actual Supabase project URL
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
    
    -- Use pg_net extension to make HTTP request to edge function
    -- This is asynchronous and won't block the notification creation
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := push_payload
      );

    -- Log the push notification attempt (optional)
    INSERT INTO public.push_notification_logs (
      notification_id,
      user_id,
      status,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'sent',
      NOW()
    ) ON CONFLICT DO NOTHING;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't prevent the notification from being created
    INSERT INTO public.push_notification_logs (
      notification_id,
      user_id,
      status,
      error_message,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'failed',
      SQLERRM,
      NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Return NEW so the notification is still created
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create push notification logs table to track sending status
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.user_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_notification_id ON public.push_notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON public.push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_status ON public.push_notification_logs(status);

-- Enable RLS on push notification logs
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for push notification logs
CREATE POLICY "Users can view their own push notification logs" ON public.push_notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create the trigger on user_notifications table
DROP TRIGGER IF EXISTS trigger_push_notification_on_insert ON public.user_notifications;
CREATE TRIGGER trigger_push_notification_on_insert
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();

-- Alternative approach using Supabase's built-in webhook functionality
-- This creates a webhook that can be called directly without pg_net

CREATE OR REPLACE FUNCTION public.send_push_notification_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  push_payload JSONB;
BEGIN
  -- Only process unread notifications
  IF NEW.read = false THEN
    
    -- Prepare the payload
    push_payload := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'notification_id', NEW.id::text,
      'title', NEW.title,
      'body', NEW.content,
      'data', jsonb_build_object(
        'action_url', NEW.action_url,
        'type', NEW.type
      )
    );

    -- You can use this approach instead if you prefer webhooks
    -- Just call your edge function URL directly from your application code
    -- when creating notifications
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Instructions for setup:
-- 1. Enable the pg_net extension in your Supabase project:
--    CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- 2. Set the required settings in your Supabase project:
--    ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://your-project.supabase.co';
--    ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'your-service-role-key';
--
-- 3. Deploy the send-push-notification edge function to your Supabase project
--
-- 4. Create the user_push_tokens table using the provided SQL script 