-- =====================================================
-- SAFE DATABASE FIX FOR FURNITURE EXPO APP
-- =====================================================
-- This script safely creates all necessary tables and fixes all relationships
-- It handles existing objects gracefully to avoid errors
-- Run this in Supabase SQL Editor to fix all database issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER_NOTIFICATIONS TABLE (Required for notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- User notifications policies (drop existing ones first)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.user_notifications;

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
-- 2. USER_PUSH_TOKENS TABLE (Required for push notifications)
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

CREATE POLICY "Users can manage own push tokens" ON public.user_push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for user_push_tokens
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);

-- =====================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
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
-- 4. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_push_tokens TO authenticated;

-- Grant permissions to service role for system operations
GRANT ALL ON public.user_notifications TO service_role;
GRANT ALL ON public.user_push_tokens TO service_role;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify everything is set up correctly:

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_notifications', 'user_push_tokens')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_notifications', 'user_push_tokens');

-- Check policies count
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_notifications', 'user_push_tokens')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '✅ Notification tables created successfully';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Triggers and indexes created';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your notification system is now ready to use!';
END $$;
