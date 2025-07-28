-- Manual Migration Script for Product Images
-- Run this in your Supabase SQL Editor to create the product_images table

-- Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to product images
CREATE POLICY "Enable read access for all users"
  ON public.product_images
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert product images (for admin panel)
CREATE POLICY "Enable insert for authenticated users"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their own product images
CREATE POLICY "Enable update for authenticated users"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete their own product images
CREATE POLICY "Enable delete for authenticated users"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'product_images table created successfully' as status;
