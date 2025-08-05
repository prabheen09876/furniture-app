// Test authentication status in the app
// Run this in browser console on your app to check auth

async function testAuthStatus() {
  try {
    console.log('🔍 Testing authentication status...');
    
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found. Make sure you\'re running this on the app page.');
      return;
    }
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session found. User is not signed in.');
      console.log('💡 Solution: Sign in to the app first, then try uploading images.');
      return;
    }
    
    console.log('✅ User is authenticated:', {
      email: session.user.email,
      id: session.user.id,
      role: session.user.role,
      aud: session.user.aud
    });
    
    // Test if we can access a protected resource
    console.log('🔍 Testing database access...');
    
    const { data, error: dbError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (dbError) {
      console.error('❌ Database access failed:', dbError);
      console.log('💡 This might indicate RLS policy issues');
    } else {
      console.log('✅ Database access successful');
    }
    
    // Test storage access
    console.log('🔍 Testing storage access...');
    
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage access failed:', storageError);
      console.log('💡 This indicates storage permission issues');
    } else {
      console.log('✅ Storage access successful. Available buckets:', buckets.map(b => b.name));
    }
    
    // Check JWT token
    const token = session.access_token;
    console.log('🔍 JWT Token info:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      expiresAt: new Date(session.expires_at * 1000).toLocaleString()
    });
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

// Also test the specific upload scenario
async function testUploadAuth() {
  try {
    console.log('🔍 Testing upload authentication...');
    
    // Create a tiny test image
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 1, 1);
    
    // Convert to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    
    console.log('✅ Test blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    // Test upload with current auth
    const filename = `auth-test-${Date.now()}.png`;
    const filePath = `product-images/${filename}`;
    
    console.log('📤 Testing upload to:', filePath);
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload failed:', error);
      
      if (error.message?.includes('JWT')) {
        console.log('💡 Solution: Authentication token issue. Try signing out and back in.');
      } else if (error.message?.includes('bucket')) {
        console.log('💡 Solution: Storage bucket missing. Run complete_storage_setup.sql');
      } else if (error.message?.includes('policy')) {
        console.log('💡 Solution: Storage policy issue. Check storage policies in Supabase.');
      }
    } else {
      console.log('✅ Upload successful:', data);
      
      // Clean up
      await supabase.storage.from('products').remove([filePath]);
      console.log('✅ Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Upload auth test failed:', error);
  }
}

console.log('🚀 Starting authentication diagnostics...');
testAuthStatus().then(() => testUploadAuth());
