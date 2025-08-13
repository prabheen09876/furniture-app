-- =====================================================
-- BULLETPROOF DATABASE FIX FOR FURNITURE EXPO APP
-- This script will create all missing tables and fix admin access
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable RLS and create extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DROP AND RECREATE ADMIN_USERS TABLE
-- =====================================================

-- Drop existing table and policies
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create admin_users table
CREATE TABLE public.admin_users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    permissions TEXT[] DEFAULT ARRAY['products:read', 'orders:read'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Allow authenticated users to read admin_users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to admin_users" ON public.admin_users
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 2. DROP AND RECREATE PROFILES TABLE
-- =====================================================

-- Drop existing table and policies
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access to profiles" ON public.profiles
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 3. CREATE USER_NOTIFICATION_PREFERENCES TABLE
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.user_notification_preferences CASCADE;

-- Create user_notification_preferences table
CREATE TABLE public.user_notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    orders_updates BOOLEAN DEFAULT TRUE,
    promotions BOOLEAN DEFAULT TRUE,
    app_updates BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own notification preferences" ON public.user_notification_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_notification_preferences" ON public.user_notification_preferences
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 4. CREATE USER_PREFERENCES TABLE
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- Create user_preferences table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_preferences" ON public.user_preferences
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_notification_preferences TO authenticated;
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_notifications TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- 6. IMMEDIATELY PROMOTE YOUR EMAIL TO ADMIN
-- =====================================================

-- Insert your admin record directly
INSERT INTO public.admin_users (
    id, 
    email, 
    role, 
    permissions, 
    is_active, 
    created_at, 
    updated_at
)
SELECT 
    au.id,
    au.email,
    'super_admin',
    ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
    TRUE,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'prabheen09876@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    permissions = ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
    is_active = TRUE,
    updated_at = NOW();

-- =====================================================
-- 7. CREATE PROFILES AND PREFERENCES FOR EXISTING USERS
-- =====================================================

-- Create profiles for existing users
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create preferences for existing users
INSERT INTO public.user_preferences (user_id, created_at, updated_at)
SELECT 
    au.id,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.user_preferences up ON up.user_id = au.id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create notification preferences for existing users
INSERT INTO public.user_notification_preferences (user_id, created_at, updated_at)
SELECT 
    au.id,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.user_notification_preferences unp ON unp.user_id = au.id
WHERE unp.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 8. CREATE USER_PUSH_TOKENS TABLE
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.user_push_tokens CASCADE;

-- Create user_push_tokens table
CREATE TABLE public.user_push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    device_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own push tokens" ON public.user_push_tokens
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_push_tokens" ON public.user_push_tokens
    FOR ALL TO service_role
    USING (true);

-- Grant permissions
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;

-- =====================================================
-- 9. CREATE USER_NOTIFICATIONS TABLE
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.user_notifications CASCADE;

-- Create user_notifications table
CREATE TABLE public.user_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications" ON public.user_notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_notifications" ON public.user_notifications
    FOR ALL TO service_role
    USING (true);

-- Grant permissions
GRANT ALL ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

-- =====================================================
-- 10. CREATE ORDERS AND ORDER_ITEMS TABLES
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT DEFAULT 'pay_on_delivery',
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    tracking_number TEXT,
    estimated_delivery_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB, -- Store product details at time of order
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Service role full access to orders" ON public.orders
    FOR ALL TO service_role
    USING (true);

-- Create RLS policies for order_items
CREATE POLICY "Users can view order items for own orders" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items for own orders" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Service role full access to order_items" ON public.order_items
    FOR ALL TO service_role
    USING (true);

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON public.order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- =====================================================
-- 11. VERIFICATION
-- =====================================================

-- Show results
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: profiles, admin_users, user_preferences, user_notification_preferences, user_push_tokens, user_notifications, orders, order_items';
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '🛒 Order management system ready';
    RAISE NOTICE '👤 Admin user: prabheen09876@gmail.com';
    RAISE NOTICE '🎉 Your app should now work perfectly!';
END $$;

-- Verify admin user was created
SELECT 
    'Admin User Created' as status,
    email,
    role,
    is_active
FROM public.admin_users 
WHERE email = 'prabheen09876@gmail.com';

-- Show table counts
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
    'admin_users' as table_name,
    COUNT(*) as record_count
FROM public.admin_users
UNION ALL
SELECT 
    'user_preferences' as table_name,
    COUNT(*) as record_count
FROM public.user_preferences
UNION ALL
SELECT 
    'user_notification_preferences' as table_name,
    COUNT(*) as record_count
FROM public.user_notification_preferences
UNION ALL
SELECT 
    'user_push_tokens' as table_name,
    COUNT(*) as record_count
FROM public.user_push_tokens
UNION ALL
SELECT 
    'user_notifications' as table_name,
    COUNT(*) as record_count
FROM public.user_notifications;
