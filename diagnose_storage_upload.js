// Comprehensive storage upload diagnostic script
// Run this in React Native Debugger or device console to diagnose the upload issue

async function diagnoseStorageUpload() {
  console.log('🔍 Diagnosing storage upload issue...');
  
  try {
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found');
      console.log('💡 Make sure you\'re running this in the app environment');
      return;
    }
    
    console.log('✅ Supabase client available');
    
    // 1. Check authentication
    console.log('\n🔐 Checking authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session - user not signed in');
      console.log('💡 Sign in to the app first');
      return;
    }
    
    console.log('✅ User authenticated:', {
      email: session.user.email,
      id: session.user.id,
      expires_at: new Date(session.expires_at * 1000).toLocaleString()
    });
    
    // 2. Check storage buckets
    console.log('\n📦 Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError);
      console.log('💡 This indicates a storage access issue');
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const productsBucket = buckets.find(b => b.name === 'products');
    if (!productsBucket) {
      console.error('❌ Products storage bucket not found');
      console.log('💡 Run complete_storage_setup.sql in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Products bucket exists:', {
      name: productsBucket.name,
      public: productsBucket.public,
      file_size_limit: productsBucket.file_size_limit,
      allowed_mime_types: productsBucket.allowed_mime_types
    });
    
    // 3. Test storage upload with small file
    console.log('\n📤 Testing storage upload...');
    
    // Create a small test blob (1x1 red pixel PNG)
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const binaryString = atob(testBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const testBlob = new Blob([bytes], { type: 'image/png' });
    
    console.log('Test blob created:', {
      size: testBlob.size,
      type: testBlob.type
    });
    
    const testFilename = `diagnostic-test-${Date.now()}.png`;
    const testFilePath = `product-images/${testFilename}`;
    
    console.log('Attempting upload to:', testFilePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(testFilePath, testBlob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      
      // Provide specific guidance based on error
      if (uploadError.message?.includes('JWT')) {
        console.log('💡 JWT/Authentication issue - try signing out and back in');
      } else if (uploadError.message?.includes('policy')) {
        console.log('💡 Storage policy issue - check RLS policies in Supabase');
      } else if (uploadError.message?.includes('bucket')) {
        console.log('💡 Bucket issue - run storage setup SQL script');
      } else if (uploadError.message?.includes('network') || uploadError.message?.includes('fetch')) {
        console.log('💡 Network connectivity issue - check internet connection');
        console.log('💡 Also check if Supabase project is active and not paused');
      } else {
        console.log('💡 Unknown error - check Supabase project status and logs');
      }
      
      return;
    }
    
    console.log('✅ Upload successful:', uploadData);
    
    // 4. Test getting public URL
    console.log('\n🔗 Testing public URL generation...');
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(testFilePath);
    
    console.log('✅ Public URL generated:', publicUrl);
    
    // 5. Test file listing
    console.log('\n📋 Testing file listing...');
    const { data: files, error: listError } = await supabase.storage
      .from('products')
      .list('product-images', {
        limit: 5,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (listError) {
      console.error('❌ File listing failed:', listError);
    } else {
      console.log('✅ File listing successful. Recent files:', files.map(f => f.name));
    }
    
    // 6. Clean up test file
    console.log('\n🧹 Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('products')
      .remove([testFilePath]);
    
    if (deleteError) {
      console.warn('⚠️ Could not clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage diagnostic completed successfully!');
    console.log('💡 If the diagnostic passes but your app upload still fails, the issue might be:');
    console.log('   - App-specific authentication state');
    console.log('   - Different network conditions in the app vs debugger');
    console.log('   - App permissions or security restrictions');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    console.log('Error details:', error.message);
    
    if (error.message?.includes('fetch')) {
      console.log('💡 Network connectivity issue detected');
      console.log('   - Check internet connection');
      console.log('   - Verify Supabase project is active');
      console.log('   - Check if device/emulator has network access');
    }
  }
}

// Additional network connectivity test
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing network connectivity...');
  
  try {
    // Test basic internet connectivity
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Basic internet connectivity works');
    } else {
      console.log('❌ Internet connectivity issue:', response.status);
    }
    
  } catch (networkError) {
    console.error('❌ Network connectivity test failed:', networkError);
    console.log('💡 This indicates a network connectivity problem');
  }
}

// Check Supabase project status
async function checkSupabaseProject() {
  console.log('\n🏗️ Checking Supabase project status...');
  
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connectivity failed:', error);
      if (error.message?.includes('JWT')) {
        console.log('💡 Authentication issue');
      } else if (error.message?.includes('relation') || error.message?.includes('table')) {
        console.log('💡 Database schema issue - tables might not exist');
      }
    } else {
      console.log('✅ Database connectivity works');
      console.log('Products table count:', data);
    }
    
  } catch (dbError) {
    console.error('❌ Database test failed:', dbError);
  }
}

console.log(`
🚀 Storage Upload Diagnostic Tool

This will test:
✅ Authentication status
✅ Storage bucket access  
✅ File upload capability
✅ Network connectivity
✅ Supabase project status

Run this to identify the exact cause of the upload failure.
`);

// Run all diagnostics
diagnoseStorageUpload()
  .then(() => testNetworkConnectivity())
  .then(() => checkSupabaseProject());
