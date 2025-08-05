// Final mobile upload test - run this in React Native Debugger
// This will test the exact same flow as your app

async function testMobileUploadFlow() {
  console.log('📱 Testing mobile upload flow...');
  
  try {
    // 1. Check environment
    console.log('Platform:', typeof Platform !== 'undefined' ? Platform.OS : 'web');
    console.log('Supabase available:', typeof supabase !== 'undefined');
    
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available. Run this in the app.');
      return;
    }
    
    // 2. Check authentication
    console.log('\n🔐 Checking authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!session) {
      console.error('❌ Not signed in. Please sign in first.');
      return;
    }
    
    console.log('✅ Signed in as:', session.user.email);
    
    // 3. Test storage bucket access
    console.log('\n📦 Testing storage access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Cannot access storage:', bucketError);
      console.log('💡 This means storage setup is incomplete');
      return;
    }
    
    const productsBucket = buckets.find(b => b.name === 'products');
    if (!productsBucket) {
      console.error('❌ Products bucket missing');
      console.log('💡 Run complete_storage_setup.sql in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Products bucket exists');
    
    // 4. Create test blob (same as your app does)
    console.log('\n🧪 Creating test blob...');
    
    // Simulate the exact blob creation your app uses
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const mimeType = 'image/png';
    
    // Use the same direct blob creation method as your app
    const binaryString = atob(testBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    
    console.log('✅ Blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    // 5. Test upload with exact same parameters as your app
    console.log('\n📤 Testing upload...');
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomId}.png`;
    const filePath = `product-images/${filename}`;
    
    console.log('Upload path:', filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      
      // Specific error analysis
      if (uploadError.message?.includes('JWT') || uploadError.message?.includes('token')) {
        console.log('💡 SOLUTION: Authentication token issue');
        console.log('   - Sign out and sign back in');
        console.log('   - Check if session is expired');
      } else if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
        console.log('💡 SOLUTION: Storage policy issue');
        console.log('   - Run complete_storage_setup.sql again');
        console.log('   - Check storage policies in Supabase dashboard');
      } else if (uploadError.message?.includes('bucket')) {
        console.log('💡 SOLUTION: Bucket configuration issue');
        console.log('   - Run complete_storage_setup.sql');
        console.log('   - Verify bucket exists and is public');
      } else if (uploadError.message?.includes('network') || uploadError.message?.includes('fetch')) {
        console.log('💡 SOLUTION: Network connectivity issue');
        console.log('   - Check internet connection on device');
        console.log('   - Verify Supabase project is not paused');
        console.log('   - Try on different network (WiFi vs mobile data)');
      } else {
        console.log('💡 SOLUTION: Unknown error');
        console.log('   - Check Supabase project status');
        console.log('   - Verify environment variables');
        console.log('   - Try restarting the app');
      }
      
      return;
    }
    
    console.log('✅ Upload successful!', uploadData);
    
    // 6. Test public URL generation
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    console.log('✅ Public URL:', publicUrl);
    
    // 7. Clean up
    const { error: deleteError } = await supabase.storage
      .from('products')
      .remove([filePath]);
    
    if (deleteError) {
      console.warn('⚠️ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Mobile upload test PASSED!');
    console.log('💡 If this test passes but your app still fails:');
    console.log('   - Check image picker permissions');
    console.log('   - Verify FileSystem module is properly installed');
    console.log('   - Check for any app-specific network restrictions');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('Error message:', error.message);
    
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      console.log('💡 This is a network connectivity issue');
      console.log('   - Check device internet connection');
      console.log('   - Try different network (WiFi vs mobile data)');
      console.log('   - Verify Supabase project URL is correct');
    }
  }
}

// Quick network test
async function quickNetworkTest() {
  console.log('\n🌐 Quick network test...');
  
  try {
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      timeout: 5000 
    });
    
    if (response.ok) {
      console.log('✅ Internet connectivity works');
    } else {
      console.log('❌ Internet issue:', response.status);
    }
  } catch (netError) {
    console.error('❌ Network test failed:', netError.message);
    console.log('💡 Device has no internet connectivity');
  }
}

console.log(`
📱 Mobile Upload Final Test

This will test the exact same upload flow as your app:
1. Authentication check
2. Storage bucket verification  
3. Blob creation (same method as app)
4. Upload with same parameters
5. Error analysis with specific solutions

Run this in React Native Debugger while connected to your phone.
`);

// Run tests
quickNetworkTest().then(() => testMobileUploadFlow());
