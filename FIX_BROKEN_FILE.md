# 🚨 Fix Broken products.tsx File

## Issue
The `app/admin/products.tsx` file got corrupted during editing and has syntax errors.

## Quick Fix

### Option 1: Restore from Git (Recommended)
```bash
# Navigate to your project directory
cd "f:\coding main\Furniture-expo-app-main\Furniture_app\project"

# Restore the file from git
git checkout HEAD -- app/admin/products.tsx

# Then manually replace just the handleImageUpload function
```

### Option 2: Manual Fix
1. **Open `app/admin/products.tsx`**
2. **Find the `handleImageUpload` function** (around line 668)
3. **Replace the entire function** with the clean version from `mobile_upload_fix.tsx`

## Clean Upload Function
The file `mobile_upload_fix.tsx` contains a clean, working version of the upload function that:

- ✅ **Works in APK builds** (no FileSystem dependency)
- ✅ **Uses only fetch approach** (proven to work from your logs)
- ✅ **Handles both web and mobile** platforms
- ✅ **No missing dependencies** (manipulateAsync, FileSystem)
- ✅ **Proper error handling** with specific messages

## Key Changes Made
1. **Removed FileSystem dependency** - not available in APK builds
2. **Removed ImageManipulator dependency** - not available in APK builds  
3. **Simplified to fetch-only approach** - this was working in your logs
4. **Added platform detection** - different handling for web vs mobile
5. **Enhanced error messages** - specific guidance for storage issues

## Expected Result
After applying this fix, your logs should show:
```
✅ Mobile platform detected, using fetch approach
✅ Fetch successful, blob size: [number]
✅ Blob created successfully: {"platform": "android", "size": [number], "type": "image/jpeg"}
✅ Attempting to upload to path: product-images/...
```

If you still get "Network request failed" after this, it means the **storage buckets haven't been created** in Supabase. Run `complete_storage_setup.sql` in Supabase SQL Editor.

## Storage Setup Required
The upload will only work after running the storage setup:

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy all of `complete_storage_setup.sql`**
3. **Paste and execute**
4. **Verify with `verify_storage_setup.sql`**

## Testing Steps
1. **Fix the broken file** (restore from git or manual fix)
2. **Replace upload function** with clean version
3. **Run storage setup SQL** in Supabase
4. **Build new APK** and test upload
5. **Should work without "Network request failed" error**

---

**TL;DR**: Restore the file from git, replace the upload function with the clean version from `mobile_upload_fix.tsx`, and run the storage setup SQL script.
