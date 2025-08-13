-- Fix notification system schema issues

-- Fix user_push_tokens table - add missing device_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_push_tokens' AND column_name = 'device_id') THEN
        ALTER TABLE public.user_push_tokens ADD COLUMN device_id TEXT;
    END IF;
END $$;

-- Fix scheduled_notifications table - add missing status column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scheduled_notifications' AND column_name = 'status') THEN
        ALTER TABLE public.scheduled_notifications ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));
    END IF;
END $$;

-- Update user_push_tokens table structure to match what the code expects
DO $$ 
BEGIN
    -- Add platform column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_push_tokens' AND column_name = 'platform') THEN
        ALTER TABLE public.user_push_tokens ADD COLUMN platform TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_push_tokens' AND column_name = 'is_active') THEN
        ALTER TABLE public.user_push_tokens ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_device_id ON public.user_push_tokens(device_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON public.user_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_is_active ON public.user_push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON public.scheduled_notifications(status);

-- Grant permissions
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;
GRANT ALL ON public.scheduled_notifications TO authenticated;
GRANT ALL ON public.scheduled_notifications TO service_role;
