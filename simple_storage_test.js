// Simple storage test - run this in React Native Debugger
// This will quickly identify if storage setup is the issue

async function simpleStorageTest() {
  console.log('🔍 Simple storage test starting...');
  
  try {
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available');
      return;
    }
    
    console.log('✅ Supabase client available');
    
    // 1. Quick auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Not signed in - please sign in first');
      return;
    }
    console.log('✅ Signed in as:', session.user.email);
    
    // 2. Check if storage buckets exist
    console.log('\n📦 Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage access failed:', bucketError.message);
      console.log('💡 SOLUTION: Run complete_storage_setup.sql in Supabase SQL Editor');
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const productsBucket = buckets.find(b => b.name === 'products');
    if (!productsBucket) {
      console.error('❌ Products bucket missing!');
      console.log('💡 SOLUTION: Run complete_storage_setup.sql in Supabase SQL Editor');
      console.log('💡 This is definitely the cause of your upload failure');
      return;
    }
    
    console.log('✅ Products bucket exists');
    
    // 3. Test simple upload
    console.log('\n📤 Testing simple upload...');
    
    // Create tiny test blob
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;
    
    console.log('Uploading test file:', testPath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(testPath, testBlob);
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Full error:', JSON.stringify(uploadError, null, 2));
      
      // Specific error analysis
      if (uploadError.message.includes('JWT') || uploadError.message.includes('token')) {
        console.log('💡 SOLUTION: Authentication issue - sign out and back in');
      } else if (uploadError.message.includes('policy')) {
        console.log('💡 SOLUTION: Storage policies missing - run complete_storage_setup.sql');
      } else if (uploadError.message.includes('bucket')) {
        console.log('💡 SOLUTION: Bucket configuration issue - run complete_storage_setup.sql');
      } else if (uploadError.message.includes('network') || uploadError.message.includes('fetch')) {
        console.log('💡 SOLUTION: Network issue - check internet connection');
      } else {
        console.log('💡 SOLUTION: Unknown error - check Supabase project status');
      }
      
      return;
    }
    
    console.log('✅ Upload successful!', uploadData);
    
    // 4. Clean up
    await supabase.storage.from('products').remove([testPath]);
    console.log('✅ Test file cleaned up');
    
    console.log('\n🎉 Storage test PASSED!');
    console.log('💡 Storage is working - your image upload should work now');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      console.log('💡 Network connectivity issue - check internet connection');
    } else {
      console.log('💡 Unexpected error - check Supabase project status');
    }
  }
}

// Quick bucket check
async function quickBucketCheck() {
  try {
    if (typeof supabase === 'undefined') {
      console.log('❌ Run this in the app console');
      return;
    }
    
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ Cannot access storage:', error.message);
      console.log('💡 Run complete_storage_setup.sql');
    } else {
      console.log('📦 Buckets found:', data.map(b => b.name));
      if (!data.find(b => b.name === 'products')) {
        console.log('❌ Products bucket missing - this is your problem!');
        console.log('💡 Run complete_storage_setup.sql in Supabase SQL Editor');
      } else {
        console.log('✅ Products bucket exists');
      }
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}

console.log(`
🧪 Simple Storage Test

This will quickly identify the exact issue:
- Check authentication
- Check if storage buckets exist  
- Test simple upload
- Provide specific solutions

Run: simpleStorageTest()
Quick check: quickBucketCheck()
`);

// Auto-run quick check
if (typeof supabase !== 'undefined') {
  quickBucketCheck();
} else {
  console.log('⏳ Run this in the app console for automatic check');
}
