-- Fix order_items table to add missing price column
-- Run this in Supabase SQL Editor to fix order creation

-- Add price column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to update updated_at timestamp for order_items
CREATE OR REPLACE FUNCTION public.update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for order_items
DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_order_items_updated_at();

-- Grant permissions
GRANT ALL ON public.order_items TO authenticated;
