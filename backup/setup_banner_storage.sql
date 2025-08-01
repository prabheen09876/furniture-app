-- Setup Banner Storage and Management System
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Create RLS policies for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active banners
CREATE POLICY "Public can view active banners" ON public.banners
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to view all banners
CREATE POLICY "Authenticated users can view all banners" ON public.banners
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert banners
CREATE POLICY "Authenticated users can insert banners" ON public.banners
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update banners
CREATE POLICY "Authenticated users can update banners" ON public.banners
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete banners
CREATE POLICY "Authenticated users can delete banners" ON public.banners
  FOR DELETE TO authenticated USING (true);

-- 4. Create storage policies for banner bucket
CREATE POLICY "Public can view banner images" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banner images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Authenticated users can update banner images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can delete banner images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'banners');

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_banners_updated_at();

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON public.banners(created_at);

-- 8. Database setup complete
-- Banners can now be added dynamically through the admin panel

-- Grant permissions
GRANT ALL ON public.banners TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
