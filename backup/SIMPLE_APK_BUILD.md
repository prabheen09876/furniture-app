# Simple APK Build Guide - Furniture Expo App

## 🚀 Easiest Method: Using Expo Application Services (EAS)

### Step 1: Login to Expo
```bash
npx eas-cli login
```
- Create account at https://expo.dev if you don't have one
- Enter your credentials when prompted

### Step 2: Initialize Project (Interactive)
```bash
npx eas-cli init
```
- This will ask you to create a project
- Choose "Yes" when asked to create a project
- It will generate a proper project ID automatically

### Step 3: Build APK
```bash
npx eas-cli build --platform android --profile preview
```
- This builds an APK (not AAB for Play Store)
- Build happens on Expo's cloud servers
- Takes about 10-15 minutes

### Step 4: Download & Install
- You'll get a download link when build completes
- Download the APK file
- Transfer to your Android device
- Enable "Install from Unknown Sources" in device settings
- Install the APK

## 🛠️ Alternative: Local Build (If you have Java installed)

### Prerequisites
- Java JDK 17+ installed
- JAVA_HOME environment variable set

### Quick Build
```bash
# Run the automated script
build-apk.bat
```

### Manual Build
```bash
# Clean and build
.\android\gradlew.bat -p android clean
.\android\gradlew.bat -p android assembleRelease
```

APK will be at: `android\app\build\outputs\apk\release\app-release.apk`

## 📱 App Features Ready for Testing

✅ **User Features:**
- Browse furniture catalog
- Search and filter products
- Add items to cart
- User registration/login
- Place orders (pay-on-delivery)
- View order history
- User profile management

✅ **Admin Features:**
- Product management (add/edit/delete)
- Category management with images
- Order management and tracking
- Banner management
- User management

✅ **Technical Features:**
- Supabase backend integration
- Image upload to cloud storage
- Real-time data synchronization
- Offline-ready architecture
- Modern UI with glassmorphism effects

## 🔧 Troubleshooting

### EAS Build Issues
```bash
# Check if logged in
npx eas-cli whoami

# Check project status
npx eas-cli project:info

# View build logs
npx eas-cli build:list
```

### Local Build Issues
```bash
# Check Java installation
java -version

# Check JAVA_HOME
echo %JAVA_HOME%

# Clean build cache
.\android\gradlew.bat -p android clean
```

## 📋 Post-Installation Setup

After installing the APK:

1. **Database Setup** (Required for full functionality):
   - Go to your Supabase dashboard
   - Run the SQL migration files in the project root:
     - `setup_auth_tables.sql`
     - `setup_storage.sql` 
     - `setup_category_storage.sql`
     - `manual_migration.sql`

2. **Environment Variables**:
   - Make sure your `.env` file has correct Supabase credentials
   - The app will connect to your Supabase instance

3. **Test Features**:
   - Create user account
   - Browse products
   - Test admin panel (login with admin credentials)
   - Place test orders

## 🎯 Quick Start Commands

**For EAS Build (Recommended):**
```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

**For Local Build:**
```bash
# Install Java JDK 17 first, then:
build-apk.bat
```

The EAS build method is recommended as it doesn't require setting up a local Android development environment.
