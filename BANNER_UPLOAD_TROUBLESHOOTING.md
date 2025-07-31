# Banner Upload Troubleshooting Guide

## Problem: "Failed to fetch" Error When Uploading Banners

### Quick Diagnosis Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for specific error messages
   - Note if it's a CORS, network, or authentication error

2. **Run Debug Script**
   - Copy contents of `debug_banner_upload.js`
   - Paste in browser console on the admin banners page
   - Follow the diagnostic results

### Common Causes & Solutions

#### 1. Missing Supabase Storage Bucket
**Symptoms:** "Bucket not found" error
**Solution:** 
```sql
-- Run this in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners', 
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;
```

#### 2. Missing Storage Policies
**Symptoms:** "not allowed" or permission errors
**Solution:**
```sql
-- Run this in Supabase SQL Editor
CREATE POLICY "Public can view banner images" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banner images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners');
```

#### 3. Authentication Issues
**Symptoms:** "Not authenticated" or "Unauthorized" errors
**Solution:**
- Make sure you're logged in to the admin panel
- Check if your user has proper permissions
- Try logging out and logging back in

#### 4. CORS Issues (Web Platform)
**Symptoms:** "Failed to fetch" with no specific error
**Solution:**
- The updated `uploadImage` function should handle this
- If still failing, try the alternative implementation in `fix_banner_upload_web.tsx`

#### 5. Image Format Issues
**Symptoms:** "Unable to process image" errors
**Solution:**
- Try different image formats (JPEG, PNG)
- Ensure image is not corrupted
- Check image size (must be under 50MB)

### Step-by-Step Fix Process

#### Step 1: Run Database Setup
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste contents of `fix_banner_upload.sql`
3. Execute the script
4. Verify with the verification queries at the end

#### Step 2: Test Basic Connectivity
1. Open browser console on admin banners page
2. Run: `debug_banner_upload.js` script
3. Check for any red ❌ errors in the output

#### Step 3: Try Alternative Upload Method
If the main upload still fails:
1. Replace the `uploadImage` function with the version from `fix_banner_upload_web.tsx`
2. This handles web platform issues better

#### Step 4: Check Environment Variables
Ensure these are set in your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Advanced Debugging

#### Enable Detailed Logging
Add this to your upload function for more detailed logs:
```javascript
console.log('Image URI type:', typeof imageUri);
console.log('Image URI starts with:', imageUri.substring(0, 20));
console.log('Platform:', Platform.OS);
console.log('Supabase URL:', supabase.supabaseUrl);
```

#### Test with Different Images
- Try a small JPEG image (< 1MB)
- Try a PNG image
- Try taking a photo vs selecting from gallery

#### Check Network Tab
1. Open Developer Tools → Network tab
2. Try uploading an image
3. Look for failed requests
4. Check if the Supabase storage request is being made

### Error Code Reference

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Failed to fetch" | Network/CORS issue | Use updated uploadImage function |
| "Bucket not found" | Missing storage bucket | Run database setup script |
| "not allowed" | Missing permissions | Add storage policies |
| "Unauthorized" | Not authenticated | Login as admin user |
| "File too large" | Image > 50MB | Use smaller image |
| "Unable to process image" | Corrupted/invalid image | Try different image |

### Still Having Issues?

1. **Check Supabase Dashboard**
   - Go to Storage → Buckets
   - Verify 'banners' bucket exists
   - Check if policies are set up

2. **Test with Postman/cURL**
   - Try uploading directly to Supabase Storage API
   - This will isolate if it's a frontend issue

3. **Check Browser Compatibility**
   - Try different browsers (Chrome, Firefox, Safari)
   - Some browsers handle blob URLs differently

4. **Restart Development Server**
   - Sometimes environment variable changes require restart
   - Clear browser cache and try again

### Success Indicators

When everything is working correctly, you should see:
- ✅ "Blob created successfully" in console
- ✅ "Upload successful" with file data
- ✅ "Public URL generated" with the image URL
- ✅ Banner appears in the banners list
- ✅ Image displays correctly in the app

### Files Modified/Created

- `app/admin/banners.tsx` - Enhanced uploadImage function
- `fix_banner_upload.sql` - Complete database setup
- `fix_banner_upload_web.tsx` - Alternative web implementation  
- `debug_banner_upload.js` - Diagnostic script
- `BANNER_UPLOAD_TROUBLESHOOTING.md` - This guide
