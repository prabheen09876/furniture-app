# Manual APK Build Steps - Run These Commands

## 🚨 **IMPORTANT: Run these commands in your terminal manually**

The EAS CLI requires interactive input, so you need to run these commands one by one in your PowerShell terminal:

### Step 1: Login to Expo
```bash
npx eas-cli login
```
- Enter your Expo account credentials
- If you don't have an account, create one at https://expo.dev

### Step 2: Initialize EAS Project
```bash
npx eas-cli init
```
- This will ask: "Would you like to create a project for @yourusername/furniture-expo-app?"
- Type `y` and press Enter
- This creates the project on Expo's servers and generates a proper project ID

### Step 3: Build APK
```bash
npx eas-cli build --platform android --profile preview
```
- This will start the cloud build process
- Takes about 10-15 minutes
- You'll get a download link when complete
npx eas-cli build --platform android --profile development
## 🔄 **Alternative: Use Expo Development Build**

If EAS build doesn't work, try this simpler approach:

### Option A: Expo Development Build
```bash
npx expo install expo-dev-client
npx expo run:android --variant release
```

### Option B: Direct Export (Creates web-compatible build)
```bash
npx expo export --platform android
```

## 🛠️ **Local Build (If you have Java installed)**

If you have Java JDK 17+ installed:

```bash
# Check Java version
java -version

# If Java is installed, run:
.\android\gradlew.bat -p android assembleRelease
```

APK will be at: `android\app\build\outputs\apk\release\app-release.apk`

## 🎯 **Current Project Status**

✅ **Configuration Fixed:**
- Removed invalid project ID
- EAS configuration is ready
- Android project structure created
- All required assets in place

✅ **Ready for Build:**
- App name: "Furniture Expo"
- Package: com.furnitureexpo.app
- All permissions configured
- Icons and splash screen ready

## 📱 **After Build Success**

1. **Download APK** from the link provided by EAS
2. **Transfer to Android device**
3. **Enable "Install from Unknown Sources"** in device settings
4. **Install the APK**
5. **Test the app** - all features should work

## 🔧 **If Build Fails**

Try these troubleshooting steps:

```bash
# Check EAS CLI version
npx eas-cli --version

# Check if logged in
npx eas-cli whoami

# Check project info (after init)
npx eas-cli project:info

# View build logs
npx eas-cli build:list
```

## 🚀 **Quick Commands Summary**

**Run these in order:**
```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

The key is running `eas init` first - this creates the project on Expo's servers and fixes the "Experience does not exist" error.
