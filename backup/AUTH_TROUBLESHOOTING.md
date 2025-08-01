# Authentication Troubleshooting Guide

## Issue: "Database error saving new user" during signup

This error occurs when the `profiles` table or its associated trigger is missing or misconfigured in your Supabase database.

## Quick Fix (Recommended)

1. **Go to your Supabase Dashboard**
   - Open your project at [supabase.com](https://supabase.com)
   - Navigate to the **SQL Editor**

2. **Run the Quick Fix Script**
   - Copy the contents of `quick_auth_fix.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

## What the Fix Does

The script will:
- ✅ Create the `profiles` table if it doesn't exist
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create a trigger function to automatically create profiles for new users
- ✅ Grant necessary permissions

## Alternative: Full Setup

If you want a complete authentication setup, use `setup_auth_tables.sql` instead. This includes:
- Profiles table with proper structure
- Admin users table for admin functionality
- All necessary triggers and policies
- Storage bucket setup

## Verifying the Fix

After running the SQL script:

1. **Check Tables Exist**
   - Go to **Table Editor** in Supabase Dashboard
   - Verify `profiles` table exists
   - Check that it has columns: `id`, `email`, `full_name`, `avatar_url`, `created_at`, `updated_at`

2. **Test User Signup**
   - Try creating a new user account
   - The signup should now work without errors
   - Check that a profile record is automatically created

## Common Issues and Solutions

### Issue: "relation 'public.profiles' does not exist"
**Solution:** Run the `quick_auth_fix.sql` script

### Issue: "permission denied for table profiles"
**Solution:** The RLS policies aren't set up correctly. Re-run the script.

### Issue: "trigger function doesn't exist"
**Solution:** The `handle_new_user()` function is missing. Run the full setup script.

### Issue: Admin user can't access admin features
**Solution:** 
1. Create an account with email `admin@example.com`
2. The AuthContext will automatically grant admin privileges
3. Or run the full `setup_auth_tables.sql` script

## Testing Admin Access

1. **Create Admin Account**
   ```
   Email: admin@example.com
   Password: (your choice)
   ```

2. **Verify Admin Status**
   - Login with the admin account
   - Navigate to `/admin` routes
   - Check that admin features are accessible

## Database Schema

The profiles table structure:
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Need More Help?

If you're still experiencing issues:

1. Check the Supabase logs in your dashboard
2. Verify your project URL and anon key in the environment
3. Ensure you're using the correct database URL
4. Check that your Supabase project is active and not paused

## Environment Variables

Make sure these are set correctly in your `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
