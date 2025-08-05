// Check environment variables in the app
// Run this in browser console to verify Supabase config

function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');
  
  // Check if we're in the right environment
  console.log('Environment:', {
    platform: typeof window !== 'undefined' ? 'web' : 'native',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
  });
  
  // Check if supabase client is available
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found');
    console.log('💡 Make sure you\'re running this on the app page');
    return;
  }
  
  console.log('✅ Supabase client found');
  
  // Check supabase configuration (without exposing sensitive data)
  const config = supabase.supabaseUrl;
  console.log('Supabase URL configured:', !!config);
  console.log('URL format check:', config ? config.includes('supabase.co') : false);
  
  // Test basic connectivity
  console.log('🔍 Testing basic connectivity...');
  
  // Simple ping test
  supabase.from('products').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('❌ Basic connectivity failed:', error.message);
        if (error.message.includes('JWT')) {
          console.log('💡 This is likely an authentication issue');
        }
      } else {
        console.log('✅ Basic connectivity successful');
        console.log('Products count:', count);
      }
    })
    .catch(err => {
      console.error('❌ Connectivity test failed:', err);
    });
}

checkEnvironment();
