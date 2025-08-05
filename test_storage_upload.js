// Test script to verify storage upload functionality
// Run this in browser console on your app to test storage

// Test function to check storage connectivity
async function testStorageUpload() {
  try {
    console.log('🔍 Testing storage upload functionality...');
    
    // Create a small test blob (1x1 pixel PNG)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Convert to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();
    
    console.log('✅ Test blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    // Test upload to Supabase Storage
    const filename = `test-${Date.now()}.png`;
    const filePath = `product-images/${filename}`;
    
    console.log('📤 Attempting upload to:', filePath);
    
    // This assumes supabase is available globally
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found. Make sure you\'re running this on the app page.');
      return;
    }
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Provide specific error guidance
      if (error.message?.includes('bucket')) {
        console.log('💡 Solution: Run complete_storage_setup.sql in Supabase SQL Editor');
      } else if (error.message?.includes('policy')) {
        console.log('💡 Solution: Check storage policies in Supabase Dashboard');
      } else if (error.message?.includes('network')) {
        console.log('💡 Solution: Check internet connection and Supabase project status');
      }
      
      return;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Test getting public URL
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
    
    console.log('🎉 Storage upload test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('💡 Make sure you\'re logged in and have proper permissions');
  }
}

// Test storage bucket existence
async function testStorageBuckets() {
  try {
    console.log('🔍 Testing storage bucket access...');
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Failed to list buckets:', error);
      return;
    }
    
    console.log('📦 Available buckets:', data.map(b => b.name));
    
    const requiredBuckets = ['products', 'category-icons', 'banners'];
    const missingBuckets = requiredBuckets.filter(bucket => 
      !data.some(b => b.name === bucket)
    );
    
    if (missingBuckets.length > 0) {
      console.error('❌ Missing buckets:', missingBuckets);
      console.log('💡 Solution: Run complete_storage_setup.sql in Supabase SQL Editor');
    } else {
      console.log('✅ All required buckets exist');
    }
    
  } catch (error) {
    console.error('❌ Bucket test failed:', error);
  }
}

// Run tests
console.log('🚀 Starting storage diagnostics...');
testStorageBuckets().then(() => testStorageUpload());
