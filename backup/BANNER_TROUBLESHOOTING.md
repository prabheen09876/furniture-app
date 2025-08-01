# Banner System Troubleshooting Guide

## Current Status
✅ Database types updated with banners table
✅ Enhanced error handling and logging
✅ Storage bucket setup scripts available

## Step-by-Step Troubleshooting

### 1. First, Run the Debug Script
Run this in your Supabase SQL Editor to check current setup:

```sql
-- Copy and paste the contents of debug_banner_setup.sql
```

### 2. Common Issues and Solutions

#### Issue: "Banners table not found"
**Solution:** Run the table creation script
```sql
-- Run create_banners_table.sql in Supabase SQL Editor
```

#### Issue: "Storage bucket not found" 
**Solution:** Run the storage setup script
```sql
-- Run create_banner_storage.sql in Supabase SQL Editor
```

#### Issue: "Permission denied" or RLS errors
**Solution:** Check authentication and policies
```sql
-- Verify you're logged in as an authenticated user
-- Check RLS policies are correctly set up
```

### 3. Testing Steps

1. **Check Console Logs**
   - Open React Native debugger or Metro console
   - Look for detailed error messages and upload progress

2. **Test Image Upload**
   - Try uploading a small image (< 1MB)
   - Check if the image appears in Supabase Storage

3. **Test Database Insert**
   - Try creating a banner without an image first
   - Then try with an image

### 4. Manual Verification

#### Check Database Table
```sql
SELECT * FROM banners;
```

#### Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE name = 'banners';
```

#### Check Storage Files
```sql
SELECT * FROM storage.objects WHERE bucket_id = 'banners';
```

### 5. Enhanced Logging

The banner admin page now includes detailed console logging:
- Image upload progress
- Database operations
- Specific error messages

**To view logs:**
1. Open React Native debugger
2. Go to Console tab
3. Try creating a banner
4. Check for specific error messages

### 6. Common Error Messages and Solutions

| Error Message | Solution |
|---------------|----------|
| "relation 'public.banners' does not exist" | Run `create_banners_table.sql` |
| "bucket 'banners' not found" | Run `create_banner_storage.sql` |
| "Storage upload failed" | Check storage bucket policies |
| "Permission denied" | Check user authentication |
| "Failed to fetch image" | Try a different image file |
| "RLS" errors | Check Row Level Security policies |

### 7. Reset and Clean Setup

If all else fails, run these in order:

1. **Drop and recreate table:**
```sql
DROP TABLE IF EXISTS banners CASCADE;
-- Then run create_banners_table.sql
```

2. **Delete and recreate storage bucket:**
```sql
DELETE FROM storage.buckets WHERE name = 'banners';
-- Then run create_banner_storage.sql
```

3. **Restart React Native app**
```bash
npx expo start --clear
```

### 8. Contact Information

If you're still experiencing issues:
1. Share the console logs from React Native debugger
2. Share the results from `debug_banner_setup.sql`
3. Specify the exact error message you're seeing

## Files to Use for Setup

1. `debug_banner_setup.sql` - Diagnostic script
2. `create_banners_table.sql` - Table creation
3. `create_banner_storage.sql` - Storage setup
4. `verify_banner_setup.sql` - Verification script

Run these in your Supabase SQL Editor in the order listed above.
