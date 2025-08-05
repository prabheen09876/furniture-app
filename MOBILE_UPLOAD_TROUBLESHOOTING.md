# Mobile Image Upload Troubleshooting Guide

## Issue: Image Upload Works on Web but Fails on Mobile (EAS Build)

### Root Cause
React Native mobile apps handle image URIs differently than web browsers. The `ImagePicker` returns local file URIs (like `file://`) that can't be directly fetched using the web `fetch()` API without proper platform-specific handling.

### Solution Implemented

The upload function now uses **platform-specific image handling**:

#### Web Platform (localhost)
- Uses standard `fetch()` API for blob URLs, data URLs, and HTTP URLs
- Works with browser-based image selection

#### Mobile Platform (EAS Build)
- Uses `expo-file-system` to read local file URIs
- Converts images to base64, then to data URLs, then to blobs
- Handles native mobile file system properly

### Code Changes Made

1. **Added Platform Detection**:
   ```typescript
   import { Platform } from 'react-native';
   import * as FileSystem from 'expo-file-system';
   ```

2. **Platform-Specific Blob Creation**:
   ```typescript
   if (Platform.OS === 'web') {
     // Web: Use fetch API directly
     const response = await fetch(imageUri);
     blob = await response.blob();
   } else {
     // Mobile: Use FileSystem to read file
     const base64 = await FileSystem.readAsStringAsync(imageUri, {
       encoding: FileSystem.EncodingType.Base64,
     });
     const dataUrl = `data:${mimeType};base64,${base64}`;
     const response = await fetch(dataUrl);
     blob = await response.blob();
   }
   ```

### Testing Steps

#### 1. Build and Test Mobile App
```bash
# Build new EAS build with the fix
eas build --platform android --profile preview

# Or build locally if configured
npx expo run:android
```

#### 2. Test Upload Functionality
1. Install the new build on your smartphone
2. Sign in to the app
3. Go to Admin → Products → Add Product
4. Try uploading an image
5. Check if upload succeeds without "Network request failed" error

#### 3. Debug Mobile Issues
If still having issues, you can:

1. **Enable Remote Debugging**:
   - Shake device → "Debug JS Remotely"
   - Open Chrome DevTools
   - Run `test_mobile_upload.js` script in console

2. **Check Logs**:
   - Use `npx expo logs --platform android` to see device logs
   - Look for platform-specific error messages

### Common Issues & Solutions

#### Issue 1: "expo-file-system not found"
**Solution**: Ensure expo-file-system is installed
```bash
npx expo install expo-file-system
```

#### Issue 2: "Permission denied" on mobile
**Solution**: Check if camera/gallery permissions are granted
```typescript
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
```

#### Issue 3: "Storage bucket not found"
**Solution**: Run the storage setup SQL script
```sql
-- Run complete_storage_setup.sql in Supabase SQL Editor
```

#### Issue 4: "Authentication failed" on mobile
**Solution**: Check if user is properly signed in
- Verify authentication state in mobile app
- Try signing out and back in
- Check if JWT token is valid

### Verification Checklist

- ✅ `expo-file-system` is installed and imported
- ✅ Platform-specific blob creation is implemented
- ✅ Storage buckets exist in Supabase
- ✅ Storage policies allow authenticated uploads
- ✅ User is authenticated in mobile app
- ✅ App has camera/gallery permissions
- ✅ Network connectivity is working

### Files Modified

1. **`app/admin/products.tsx`**:
   - Added Platform import
   - Added expo-file-system import
   - Implemented platform-specific blob creation
   - Enhanced error logging with platform info

2. **Test Scripts Created**:
   - `test_mobile_upload.js` - Mobile-specific upload testing
   - `test_auth_status.js` - Authentication verification
   - `check_env.js` - Environment configuration check

### Expected Behavior After Fix

- **Web (localhost)**: Upload works as before
- **Mobile (EAS build)**: Upload now works with proper file handling
- **Error Messages**: More descriptive, platform-specific error messages
- **Logging**: Enhanced logging shows platform and detailed error info

### Next Steps

1. **Build New Version**: Create new EAS build with the fixes
2. **Test Thoroughly**: Test image upload on both web and mobile
3. **Monitor Logs**: Check for any remaining issues in device logs
4. **Verify Storage**: Ensure uploaded images appear in Supabase Storage

If issues persist after implementing these fixes, check:
- Supabase project status and connectivity
- Storage bucket configuration and policies
- Authentication token validity
- Device-specific permissions and restrictions
