# Build APK Instructions for Furniture Expo App

## Prerequisites

### 1. Install Java Development Kit (JDK)
- Download and install JDK 17 or later from: https://adoptium.net/
- During installation, make sure to set JAVA_HOME environment variable
- Or manually set JAVA_HOME to your JDK installation path (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17.0.8.101-hotspot`)

### 2. Install Android SDK (Optional - if you want Android Studio)
- Download Android Studio from: https://developer.android.com/studio
- Install Android SDK through Android Studio
- Set ANDROID_HOME environment variable to SDK path

## Build Methods

### Method 1: Using EAS Build (Cloud Build - Recommended)

1. **Create Expo Account and Login**
   ```bash
   npx eas-cli login
   ```

2. **Initialize EAS Project (Interactive)**
   ```bash
   npx eas-cli init
   ```
   - This will create the project on Expo's servers
   - Follow the prompts to set up your project

3. **Build APK**
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

4. **Download APK**
   - The build will be uploaded to Expo servers
   - You'll get a download link when build completes
   - Download and install the APK on your device

### Method 2: Local Build (Requires Java/Android SDK)

1. **Set Environment Variables**
   ```bash
   # Add to your system environment variables:
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.8.101-hotspot
   ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   ```

2. **Build APK**
   ```bash
   # Navigate to project directory
   cd "f:\coding main\Furniture-expo-app-main\Furniture_app\project"
   
   # Build release APK
   .\android\gradlew.bat -p android assembleRelease
   ```

3. **Find APK**
   - APK will be located at: `android\app\build\outputs\apk\release\app-release.apk`

### Method 3: Using Expo Development Build

1. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

2. **Run Android Build**
   ```bash
   npx expo run:android --variant release
   ```

## Current Project Status

✅ **Project Configuration Complete**
- App name: "Furniture Expo"
- Package name: com.furnitureexpo.app
- Android configuration added to app.json
- EAS configuration created (eas.json)
- Android project generated with `expo prebuild`

✅ **Required Assets Created**
- App icon: assets/images/icon.png
- Adaptive icon: assets/images/adaptive-icon.png
- Splash screen: assets/images/splash.png

✅ **Permissions Configured**
- Camera access
- Storage access
- Internet access
- Network state access

## Quick Start (Recommended)

**If you have an Expo account:**
```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

**If you want to set up local build environment:**
1. Install JDK 17 from https://adoptium.net/
2. Set JAVA_HOME environment variable
3. Run: `.\android\gradlew.bat -p android assembleRelease`

## App Features Included

- 🛋️ Furniture catalog browsing
- 🛒 Shopping cart functionality
- 👤 User authentication
- 📱 Modern UI with glassmorphism effects
- 🏪 Admin panel for product management
- 📦 Order management system
- 💳 Pay-on-delivery checkout
- 🔍 Product search and filtering
- 📸 Image upload for products
- 🏷️ Category-based navigation

## Troubleshooting

### Java Issues
- Make sure JAVA_HOME points to JDK installation directory
- Add Java bin directory to PATH: `%JAVA_HOME%\bin`
- Restart command prompt after setting environment variables

### Build Issues
- Clean build: `.\android\gradlew.bat -p android clean`
- Rebuild: `.\android\gradlew.bat -p android assembleRelease`

### EAS Build Issues
- Make sure you're logged in: `npx eas-cli whoami`
- Check project configuration: `npx eas-cli config`

## APK Installation

1. Enable "Install from Unknown Sources" on your Android device
2. Transfer APK to your device
3. Install the APK
4. Launch "Furniture Expo" app

## Next Steps

After building the APK:
1. Test the app on different Android devices
2. Set up your Supabase database (run the SQL migration files)
3. Configure your environment variables in production
4. Upload to Google Play Store (if desired)
