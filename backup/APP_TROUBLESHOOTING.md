# 🔧 App Not Running - Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: App Crashes on Startup**

**Possible Causes:**
- Missing or incorrect Supabase configuration
- Database not set up properly
- Environment variables not configured

**Solutions:**

#### **A. Check Supabase Configuration**
1. **Verify .env file exists** with correct values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Get your Supabase credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Copy URL and anon key

#### **B. Set Up Database Tables**
Run these SQL scripts in your Supabase SQL Editor:

1. **Authentication Setup:**
   ```sql
   -- Run: setup_auth_tables.sql
   ```

2. **Storage Setup:**
   ```sql
   -- Run: setup_storage.sql
   ```

3. **Product Tables:**
   ```sql
   -- Run: manual_migration.sql
   ```

4. **Categories Setup:**
   ```sql
   -- Run: setup_category_storage.sql
   ```

### **Issue 2: White Screen / Blank App**

**Solutions:**

#### **A. Rebuild with Development Profile**
```bash
npx eas-cli build --platform android --profile development
```

#### **B. Test with Expo Go First**
```bash
npx expo start --tunnel
```
- Install "Expo Go" app on your phone
- Scan QR code to test

### **Issue 3: Network/API Errors**

**Solutions:**

#### **A. Check Internet Connection**
- Ensure your device has internet access
- Try switching between WiFi and mobile data

#### **B. Verify Supabase Project Status**
- Go to Supabase dashboard
- Check if your project is active (not paused)

### **Issue 4: App Won't Install**

**Solutions:**

#### **A. Enable Unknown Sources**
1. Go to Settings → Security
2. Enable "Install from Unknown Sources"
3. Or enable for your specific browser app

#### **B. Clear Download and Retry**
1. Delete the downloaded APK
2. Re-download from the EAS link
3. Try installing again

## 🔍 **Debugging Steps**

### **Step 1: Check App Logs**
If you have Android Studio or ADB:
```bash
adb logcat | grep -i expo
```

### **Step 2: Test with Development Build**
```bash
# Build development version with debugging
npx eas-cli build --platform android --profile development
```

### **Step 3: Test Locally First**
```bash
# Test in development mode
npx expo start --dev-client
```

## 🚀 **Quick Fix Commands**

### **Option 1: Rebuild with Debugging**
```bash
npx eas-cli build --platform android --profile development
```

### **Option 2: Test with Expo Go**
```bash
npx expo start --tunnel
```

### **Option 3: Check Configuration**
```bash
npx expo doctor
```

## 📋 **Environment Setup Checklist**

### **Required Files:**
- [ ] `.env` file with Supabase credentials
- [ ] Supabase project is active
- [ ] Database tables created
- [ ] Storage buckets set up

### **Database Tables Required:**
- [ ] `profiles` table (for user authentication)
- [ ] `products` table (for product catalog)
- [ ] `product_images` table (for product images)
- [ ] `categories` table (for product categories)
- [ ] `orders` table (for order management)
- [ ] `order_items` table (for order details)

### **Storage Buckets Required:**
- [ ] `products` bucket (for product images)
- [ ] `category-icons` bucket (for category images)
- [ ] `banners` bucket (for banner images)

## 🔧 **Create Missing Environment File**

If your `.env` file is missing, create it with:

```bash
# Create .env file
echo "EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" >> .env
```

Replace with your actual Supabase URL and anon key.

## 🎯 **Most Likely Solutions**

### **1. Missing Database Setup (Most Common)**
- Go to Supabase dashboard
- Run all SQL migration files in SQL Editor
- This creates required tables and policies

### **2. Environment Variables**
- Ensure `.env` file exists with correct Supabase credentials
- Rebuild APK after adding environment variables

### **3. Supabase Project Issues**
- Check if Supabase project is paused
- Verify API keys are correct
- Ensure RLS policies are set up

## 📞 **Next Steps**

1. **Check what happens when you open the app:**
   - Does it crash immediately?
   - Shows white screen?
   - Shows error message?

2. **Try development build first:**
   ```bash
   npx eas-cli build --platform android --profile development
   ```

3. **Test with Expo Go:**
   ```bash
   npx expo start --tunnel
   ```

**Tell me what specific behavior you see when you try to open the app, and I'll provide targeted solutions!**
