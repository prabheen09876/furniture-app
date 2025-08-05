# Android Image Upload 400 Error Fix

## Problem Identified

From the Supabase logs, we identified a **400 Bad Request** error when uploading images from Android devices:

```
POST | 400 | 122.162.147.190 | https://khoxioouyornfttziire.supabase.co/storage/v1/object/products/product-images/1754401674837-0auuvu.jpeg
Content-Length: 162 bytes (very small - indicating empty/malformed blob)
User-Agent: okhttp/4.9.2 (Android)
```

**Root Cause**: The blob creation process was failing on Android, resulting in empty or malformed blobs being sent to Supabase Storage.

## Solution Applied

### 1. Enhanced Mobile Blob Creation

**Before** (causing 400 errors):
```typescript
// Direct fetch to blob (unreliable on Android)
const response = await fetch(imageUri);
blob = await response.blob();
```

**After** (fixed):
```typescript
// Enhanced ArrayBuffer approach for Android
const response = await fetch(imageUri, {
  method: 'GET',
  headers: {
    'Accept': 'image/*',
  },
});

const arrayBuffer = await response.arrayBuffer();

if (arrayBuffer.byteLength === 0) {
  throw new Error('Image data is empty');
}

// Convert ArrayBuffer to Blob with proper MIME type
blob = new Blob([new Uint8Array(arrayBuffer)] as any, { 
  type: mimeType, 
  lastModified: Date.now() 
});
```

### 2. Enhanced Validation

Added multiple validation layers:

```typescript
// Validate ArrayBuffer
if (arrayBuffer.byteLength === 0) {
  throw new Error('Image data is empty');
}

// Validate final blob
if (!blob || blob.size === 0) {
  throw new Error('Blob creation failed - blob is empty');
}
```

### 3. Explicit Content-Type Headers

Added explicit content-type to upload options:

```typescript
const { data, error } = await supabase.storage
  .from('products')
  .upload(filePath, blob, {
    contentType: blob.type || 'image/jpeg',  // ← Added this
    cacheControl: '3600',
    upsert: false
  });
```

### 4. Better Error Handling

Enhanced error messages for debugging:

```typescript
console.log('Enhanced fetch successful, blob size:', blob.size, 'type:', blob.type);

// Specific error messages for different failure scenarios
if (error.message?.includes('network')) {
  errorMessage = 'Network error. Please check your internet connection.';
}
```

## Key Improvements

1. **ArrayBuffer Approach**: More reliable than direct blob conversion on Android
2. **Empty Blob Detection**: Prevents 400 errors from empty uploads
3. **Explicit Headers**: Ensures proper content-type is sent
4. **Enhanced Logging**: Better debugging information
5. **MIME Type Detection**: Proper content-type based on file extension

## Testing Steps

1. **Build New APK**: Create a new EAS build with these fixes
2. **Test Upload**: Try uploading images on Android device
3. **Check Logs**: Monitor console for success messages
4. **Verify Storage**: Confirm images appear in Supabase Storage

## Diagnostic Tools

Use the debug script to test upload functionality:

```javascript
// In React Native debugger or browser console
await global.debugUpload.runDiagnostics();
```

## Expected Results

- ✅ **No more 400 errors** during image upload
- ✅ **Proper blob sizes** (not 162 bytes)
- ✅ **Successful uploads** to Supabase Storage
- ✅ **Images display** correctly in the app

## Files Modified

1. `app/admin/products.tsx` - Enhanced `handleImageUpload` function
2. `debug_upload_400_error.js` - Diagnostic script for troubleshooting
3. `ANDROID_UPLOAD_400_ERROR_FIX.md` - This documentation

## Technical Notes

- **Platform Detection**: Uses `Platform.OS` to apply Android-specific logic
- **TypeScript Compatibility**: Uses type assertions for Blob constructor
- **Backward Compatibility**: Web platform continues using original fetch approach
- **Error Recovery**: Graceful handling of network issues and malformed data

The fix specifically addresses the Android APK build environment where direct blob conversion from file URIs was failing, causing the 400 Bad Request errors in Supabase Storage.
