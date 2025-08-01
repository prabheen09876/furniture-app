-- COMPLETE DATABASE SETUP FOR FURNITURE EXPO APP
-- Run this entire script in your Supabase SQL Editor
-- This will create ALL required tables and policies

-- =============================================
-- 1. PROFILES TABLE (Authentication)
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. CATEGORIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (id, name, slug, description, sort_order) VALUES
  ('all', 'All Products', 'all', 'View all available products', 0),
  ('chairs', 'Chairs', 'chairs', 'Comfortable seating solutions', 1),
  ('tables', 'Tables', 'tables', 'Dining and work tables', 2),
  ('sofas', 'Sofas', 'sofas', 'Living room furniture', 3),
  ('beds', 'Beds', 'beds', 'Bedroom furniture', 4),
  ('lamps', 'Lamps', 'lamps', 'Lighting solutions', 5),
  ('decor', 'Decor', 'decor', 'Home decoration items', 6),
  ('storage', 'Storage', 'storage', 'Storage solutions', 7)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PRODUCTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT REFERENCES public.categories(id),
  brand TEXT,
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 4. PRODUCT IMAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.product_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- =============================================
-- 5. ORDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method TEXT DEFAULT 'pay_on_delivery',
  tracking_number TEXT,
  estimated_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable all for authenticated users" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 6. ORDER ITEMS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 7. BANNERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.banners
  FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.banners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 8. ADMIN USERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.admin_users
  FOR SELECT TO authenticated USING (true);

-- Insert default admin user
INSERT INTO public.admin_users (email, role) VALUES
  ('admin@example.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 9. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. STORAGE SETUP
-- =============================================

-- Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('products', 'products', true),
  ('category-icons', 'category-icons', true),
  ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for products bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'products');

-- Storage policies for category-icons bucket
CREATE POLICY "Public read access for categories" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-icons');

CREATE POLICY "Authenticated users can upload categories" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'category-icons');

CREATE POLICY "Authenticated users can update categories" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'category-icons');

CREATE POLICY "Authenticated users can delete categories" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'category-icons');

-- Storage policies for banners bucket
CREATE POLICY "Public read access for banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Authenticated users can update banners" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can delete banners" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'banners');

-- =============================================
-- SETUP COMPLETE!
-- =============================================

-- Verify setup
SELECT 'Setup completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'categories', 'products', 'product_images', 'orders', 'order_items', 'banners', 'admin_users');
