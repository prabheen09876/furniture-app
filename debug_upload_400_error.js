/**
 * Debug script for 400 error during image upload
 * Run this in browser console or React Native debugger
 */

// Test 1: Check if storage bucket exists
async function checkStorageBucket() {
  console.log('🔍 Checking storage bucket...');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return false;
    }
    
    console.log('📦 Available buckets:', data.map(b => b.name));
    
    const productsBucket = data.find(b => b.name === 'products');
    if (!productsBucket) {
      console.error('❌ Products bucket not found!');
      return false;
    }
    
    console.log('✅ Products bucket found:', productsBucket);
    return true;
    
  } catch (error) {
    console.error('❌ Exception checking buckets:', error);
    return false;
  }
}

// Test 2: Check storage policies
async function checkStoragePolicies() {
  console.log('🔍 Checking storage policies...');
  
  try {
    // Try to list files in the bucket (should work if policies are correct)
    const { data, error } = await supabase.storage
      .from('products')
      .list('product-images', { limit: 1 });
    
    if (error) {
      console.error('❌ Error listing files (policy issue?):', error);
      return false;
    }
    
    console.log('✅ Storage policies seem correct, can list files');
    return true;
    
  } catch (error) {
    console.error('❌ Exception checking policies:', error);
    return false;
  }
}

// Test 3: Test blob creation from a simple image
async function testBlobCreation() {
  console.log('🔍 Testing blob creation...');
  
  try {
    // Create a simple 1x1 pixel red image as data URL
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 1, 1);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    console.log('📊 Test data URL length:', dataUrl.length);
    
    // Convert to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    console.log('✅ Test blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    if (blob.size === 0) {
      console.error('❌ Blob is empty!');
      return false;
    }
    
    return blob;
    
  } catch (error) {
    console.error('❌ Error creating test blob:', error);
    return false;
  }
}

// Test 4: Test actual upload with small blob
async function testUpload() {
  console.log('🔍 Testing upload with small test image...');
  
  const blob = await testBlobCreation();
  if (!blob) return false;
  
  try {
    const timestamp = Date.now();
    const filename = `test-${timestamp}.jpeg`;
    const filePath = `product-images/${filename}`;
    
    console.log('📤 Uploading test file:', filePath);
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    console.log('🔗 Public URL:', publicUrl);
    
    // Clean up - delete test file
    await supabase.storage.from('products').remove([filePath]);
    console.log('🧹 Test file cleaned up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Exception during upload:', error);
    return false;
  }
}

// Test 5: Check authentication
async function checkAuth() {
  console.log('🔍 Checking authentication...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return false;
    }
    
    if (!user) {
      console.error('❌ No authenticated user');
      return false;
    }
    
    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Exception checking auth:', error);
    return false;
  }
}

// Run all diagnostics
async function runDiagnostics() {
  console.log('🚀 Starting upload diagnostics...');
  console.log('Platform:', typeof window !== 'undefined' ? 'Web' : 'Mobile');
  
  const results = {
    auth: await checkAuth(),
    bucket: await checkStorageBucket(),
    policies: await checkStoragePolicies(),
    blobCreation: await testBlobCreation(),
    upload: await testUpload()
  };
  
  console.log('📊 Diagnostic Results:', results);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('✅ All diagnostics passed! Upload should work.');
  } else {
    console.log('❌ Some diagnostics failed. Check the issues above.');
  }
  
  return results;
}

// Export for use
if (typeof window !== 'undefined') {
  window.debugUpload = {
    runDiagnostics,
    checkAuth,
    checkStorageBucket,
    checkStoragePolicies,
    testBlobCreation,
    testUpload
  };
  
  console.log('🛠️ Debug functions available as window.debugUpload');
  console.log('Run: await window.debugUpload.runDiagnostics()');
}

// For React Native
if (typeof global !== 'undefined') {
  global.debugUpload = {
    runDiagnostics,
    checkAuth,
    checkStorageBucket,
    checkStoragePolicies,
    testBlobCreation,
    testUpload
  };
  
  console.log('🛠️ Debug functions available as global.debugUpload');
  console.log('Run: await global.debugUpload.runDiagnostics()');
}
