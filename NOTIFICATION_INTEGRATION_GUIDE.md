# Notification System Integration Guide

## Overview
This guide helps you integrate and test the notification system in your Furniture Expo app.

## Files Created
1. **`NOTIFICATION_SYSTEM_FIX.sql`** - Database setup script
2. **`services/notificationServiceSimple.ts`** - Clean notification service implementation
3. **`components/NotificationTest.tsx`** - Test component for notification functionality

## Setup Steps

### 1. Database Setup
Run the SQL script in Supabase SQL Editor:
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Copy and paste the contents of NOTIFICATION_SYSTEM_FIX.sql
-- Execute the script
```

This creates:
- `user_notifications` table
- `user_push_tokens` table
- Proper RLS policies
- Admin user setup

### 2. Replace Notification Service
Replace the current notification service with the simplified version:

```typescript
// In your app, replace imports from:
import notificationService from '../services/notificationService';

// To:
import notificationService from '../services/notificationServiceSimple';
```

### 3. Add Test Component to Your App
Add the NotificationTest component to your app for testing:

```typescript
// In your main navigation or a test screen:
import NotificationTest from '../components/NotificationTest';

// Add it as a screen or modal
<NotificationTest />
```

## Key Features

### ✅ Working Features
- **Local Notifications**: Immediate notifications without internet
- **Push Notifications**: Cloud-based notifications via Expo
- **Database Integration**: Store notifications in Supabase
- **Badge Management**: Update app icon badge count
- **Order Notifications**: Specialized order status updates
- **Deal Notifications**: Marketing and promotional notifications
- **Read/Unread Management**: Mark notifications as read
- **Proper Error Handling**: Graceful fallbacks when services unavailable

### 🔧 Configuration
The service automatically:
- Sets up Android notification channels
- Requests notification permissions
- Registers push tokens with Expo
- Saves tokens to Supabase
- Handles offline scenarios

## Testing Instructions

### 1. Basic Setup Test
```typescript
// Initialize the service
await notificationService.initialize();

// Check if push token is available
const token = notificationService.getPushToken();
console.log('Push token:', token);
```

### 2. Local Notification Test
```typescript
await notificationService.sendImmediateNotification({
  title: 'Test Notification',
  body: 'This is a test!',
  data: { type: 'test' }
});
```

### 3. Order Notification Test
```typescript
await notificationService.sendOrderNotification(
  'ORDER123',
  'shipped',
  'Your order has been shipped!',
  userId
);
```

### 4. Database Integration Test
```typescript
// Get user notifications
const { data, error } = await notificationService.getUserNotifications(userId);

// Mark as read
await notificationService.markAllNotificationsAsRead(userId);

// Update badge count
await notificationService.updateBadgeCount();
```

## Integration with Existing App

### 1. Initialize in App.tsx or Main Component
```typescript
import notificationService from './services/notificationServiceSimple';

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    notificationService.initialize();
    
    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  // ... rest of your app
}
```

### 2. Use in Order Processing
```typescript
// In your checkout or order processing logic
const handleOrderStatusUpdate = async (orderId: string, status: string, userId: string) => {
  await notificationService.sendOrderNotification(
    orderId,
    status,
    `Your order #${orderId} is now ${status}`,
    userId
  );
};
```

### 3. Use in Admin Panel
```typescript
// In your admin panel for sending promotional notifications
const sendPromoNotification = async () => {
  await notificationService.sendDealNotification(
    '🔥 Flash Sale!',
    'Get 50% off on all furniture items!',
    'promo_123'
  );
};
```

## Troubleshooting

### Common Issues

1. **"user_notifications table not found"**
   - Solution: Run `NOTIFICATION_SYSTEM_FIX.sql` in Supabase

2. **"Push token not available"**
   - Ensure you're testing on a physical device
   - Check if notification permissions are granted
   - Verify Expo project ID is configured

3. **"Notifications not appearing"**
   - Check device notification settings
   - Ensure app has notification permissions
   - Test with local notifications first

4. **"Database errors"**
   - Verify Supabase connection
   - Check RLS policies are set up correctly
   - Ensure user is authenticated

### Debug Mode
Enable debug logging by checking console output:
```typescript
// The service logs helpful information:
// - Push token registration
// - Database operations
// - Error messages with solutions
```

## Production Considerations

1. **Push Token Management**
   - Tokens are automatically saved to database
   - Tokens are refreshed when needed
   - Old tokens are updated, not duplicated

2. **Error Handling**
   - Service gracefully handles missing tables
   - Falls back to local notifications when push fails
   - Provides clear error messages for debugging

3. **Performance**
   - Database queries are optimized with indexes
   - Notification listeners are properly cleaned up
   - Badge counts are efficiently calculated

4. **Security**
   - RLS policies protect user data
   - Only authenticated users can access their notifications
   - Admin users have appropriate permissions

## Next Steps

1. **Run the database setup script**
2. **Test with the NotificationTest component**
3. **Integrate into your existing screens**
4. **Test on physical devices**
5. **Configure push notifications for production**

The notification system is now ready for integration and testing!
