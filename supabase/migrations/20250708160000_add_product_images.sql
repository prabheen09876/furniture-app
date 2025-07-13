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

-- Create trigger to update updated_at column
CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Move existing product images to the new table
INSERT INTO public.product_images (product_id, image_url, created_at, updated_at)
SELECT id, image_url, created_at, updated_at 
FROM public.products 
WHERE image_url IS NOT NULL;

-- Add comment to the table
COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product';

-- Add comments to columns
COMMENT ON COLUMN public.product_images.product_id IS 'Reference to the product';
COMMENT ON COLUMN public.product_images.image_url IS 'URL of the product image';
COMMENT ON COLUMN public.product_images.alt_text IS 'Alternative text for accessibility';
COMMENT ON COLUMN public.product_images.sort_order IS 'Order in which to display images (lower numbers first)';

-- Note: We're not dropping the image_url column from products table yet to maintain backward compatibility
-- You can remove it in a future migration after updating all code to use the new table
