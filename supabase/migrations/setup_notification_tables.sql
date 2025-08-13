-- Setup Push Notification Tables for Furniture Expo App

-- Create user_push_tokens table to store device tokens
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios', 'android', 'web'
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS user_push_tokens_user_id_idx ON public.user_push_tokens (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_push_tokens_token_idx ON public.user_push_tokens (token);

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orders_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  app_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user preferences lookup
CREATE INDEX IF NOT EXISTS user_notification_preferences_user_id_idx ON public.user_notification_preferences (user_id);

-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  target_type TEXT NOT NULL, -- 'all', 'specific_users', 'topic'
  target_users UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_history table
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_type TEXT NOT NULL,
  target_count INTEGER,
  success_count INTEGER,
  failure_count INTEGER,
  created_by UUID REFERENCES auth.users(id)
);

-- Auto-update timestamps trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_push_tokens_updated_at ON public.user_push_tokens;
CREATE TRIGGER update_user_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_notifications_updated_at ON public.scheduled_notifications;
CREATE TRIGGER update_scheduled_notifications_updated_at
BEFORE UPDATE ON public.scheduled_notifications
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Setup RLS (Row Level Security) for the tables
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_push_tokens
CREATE POLICY "Users can view their own tokens" 
  ON public.user_push_tokens 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
  ON public.user_push_tokens 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
  ON public.user_push_tokens 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
  ON public.user_push_tokens 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_notification_preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.user_notification_preferences 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.user_notification_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_notification_preferences 
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin-only policies for scheduled_notifications and history
CREATE POLICY "Admins can manage scheduled notifications"
  ON public.scheduled_notifications
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view notification history"
  ON public.notification_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Create admin policy for viewing all tokens (for sending notifications)
CREATE POLICY "Admins can view all tokens"
  ON public.user_push_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Create admin policy for viewing all preferences
CREATE POLICY "Admins can view all preferences"
  ON public.user_notification_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_notification_preferences TO authenticated;
GRANT ALL ON public.scheduled_notifications TO authenticated;
GRANT SELECT ON public.notification_history TO authenticated;

-- Update database type definitions
COMMENT ON TABLE public.user_push_tokens IS 'Stores push notification tokens for user devices';
COMMENT ON TABLE public.user_notification_preferences IS 'User preferences for different notification types';
COMMENT ON TABLE public.scheduled_notifications IS 'Notifications scheduled to be sent at a future time';
COMMENT ON TABLE public.notification_history IS 'History of sent notifications';

-- Verification query
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_push_tokens'
);
