-- =====================================================
-- NOTIFICATION SYSTEM FIX FOR FURNITURE EXPO APP
-- =====================================================
-- This script creates all necessary tables and fixes for the notification system
-- Run this in Supabase SQL Editor to fix notification-related issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER_NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- User notifications policies (drop existing ones first)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Admin users can view all notifications" ON public.user_notifications;

CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- Create indexes for user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- =====================================================
-- 2. USER_PUSH_TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Enable RLS on user_push_tokens
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- User push tokens policies (drop existing ones first)
DROP POLICY IF EXISTS "Users can manage own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "System can access push tokens" ON public.user_push_tokens;

CREATE POLICY "Users can manage own push tokens" ON public.user_push_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "System can access push tokens" ON public.user_push_tokens
  FOR SELECT USING (true);

-- Create indexes for user_push_tokens
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON public.user_push_tokens(token);

-- =====================================================
-- 3. ADMIN_USERS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users policies (drop existing ones first)
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "System can manage admin_users" ON public.admin_users;

CREATE POLICY "Admin users can view admin_users" ON public.admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users)
  );

CREATE POLICY "System can manage admin_users" ON public.admin_users
  FOR ALL USING (true);

-- Create admin policy for notifications
CREATE POLICY "Admin users can view all notifications" ON public.user_notifications
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users)
  );

-- =====================================================
-- 4. UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
    AND table_name IN ('user_notifications', 'user_push_tokens', 'admin_users')
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
      RAISE NOTICE 'Created trigger for table %', t;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating trigger for table %: %', t, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- =====================================================
-- 5. INSERT DEFAULT ADMIN USER (if not exists)
-- =====================================================
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'admin@example.com'
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

-- Grant permissions to service role for system operations
GRANT ALL ON public.user_notifications TO service_role;
GRANT ALL ON public.user_push_tokens TO service_role;
GRANT ALL ON public.admin_users TO service_role;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify everything is set up correctly:

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_notifications', 'user_push_tokens', 'admin_users')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_notifications', 'user_push_tokens', 'admin_users');

-- Check policies count
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_notifications', 'user_push_tokens', 'admin_users')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Notification system setup complete!';
  RAISE NOTICE '✅ Tables created: user_notifications, user_push_tokens, admin_users';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Triggers and indexes created';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your notification system is now ready to use!';
END $$;
