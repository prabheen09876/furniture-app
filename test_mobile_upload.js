// Test mobile image upload functionality
// Run this in the mobile app console (if available) or use for debugging

async function testMobileUpload() {
  console.log('🔍 Testing mobile upload functionality...');
  
  try {
    // Simulate the mobile upload process
    console.log('Platform detected:', typeof Platform !== 'undefined' ? Platform.OS : 'unknown');
    
    // Check if FileSystem is available (mobile only)
    if (typeof FileSystem !== 'undefined') {
      console.log('✅ FileSystem available for mobile upload');
    } else {
      console.log('❌ FileSystem not available - this might be web platform');
    }
    
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found');
      return;
    }
    
    console.log('✅ Supabase client available');
    
    // Test authentication
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session - user not signed in');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    // Test storage bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage bucket access failed:', bucketError);
      return;
    }
    
    const productsBucket = buckets.find(b => b.name === 'products');
    if (!productsBucket) {
      console.error('❌ Products storage bucket not found');
      console.log('💡 Run complete_storage_setup.sql in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Products storage bucket exists');
    
    // Create a test data URL (1x1 red pixel)
    const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Test blob creation from data URL
    const response = await fetch(testDataUrl);
    const blob = await response.blob();
    
    console.log('✅ Test blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    // Test upload
    const filename = `mobile-test-${Date.now()}.png`;
    const filePath = `product-images/${filename}`;
    
    console.log('📤 Testing upload to:', filePath);
    
    const { data, error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      
      if (uploadError.message?.includes('JWT')) {
        console.log('💡 Solution: Authentication issue - try signing out and back in');
      } else if (uploadError.message?.includes('policy')) {
        console.log('💡 Solution: Storage policy issue - check Supabase storage policies');
      } else if (uploadError.message?.includes('bucket')) {
        console.log('💡 Solution: Storage bucket issue - run storage setup SQL');
      }
      
      return;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    console.log('✅ Public URL generated:', publicUrl);
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('products')
      .remove([filePath]);
    
    if (deleteError) {
      console.warn('⚠️ Could not clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('🎉 Mobile upload test completed successfully!');
    
  } catch (error) {
    console.error('❌ Mobile upload test failed:', error);
    console.log('Error details:', error.message);
  }
}

// Instructions for testing
console.log(`
📱 Mobile Upload Test Instructions:
1. Make sure you're signed in to the app
2. Run this script in the mobile app console (if available)
3. Or use React Native Debugger to run this script
4. Check the console output for detailed results

🔧 If upload fails:
- Ensure storage setup SQL has been run
- Check authentication status
- Verify storage policies in Supabase dashboard
`);

// Auto-run if in the right environment
if (typeof supabase !== 'undefined') {
  testMobileUpload();
} else {
  console.log('⏳ Waiting for Supabase client to be available...');
}
