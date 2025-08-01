-- Add missing columns to orders table for tracking and delivery
-- Run this in Supabase SQL Editor to enable full order management features

-- Add order_number column (required field)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT NOT NULL DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT;

-- Add subtotal column (required field)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add tracking_number column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add estimated_delivery column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_orders_updated_at();

-- Fix order_items table
-- Add price column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add updated_at column to order_items if it doesn't exist
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
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
