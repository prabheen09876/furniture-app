-- Create banners table if it doesn't exist
-- Run this in Supabase SQL Editor

-- 1. Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Public banners are viewable by everyone" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage banners" ON public.banners
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.banners TO authenticated;

-- 5. Verify table was created
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'banners' AND table_schema = 'public';
