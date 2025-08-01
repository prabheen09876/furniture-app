# 📱 APK Build Guide for Furniture Expo App

## Current Status
Your React Native Expo app is ready to build, but requires Android SDK setup.

## 🚀 Quick Setup Options

### Option 1: Install Android Studio (Recommended)
1. **Download Android Studio**: https://developer.android.com/studio
2. **Install Android Studio** with default settings
3. **Open Android Studio** and let it download the Android SDK
4. **Run our setup script**: `.\setup-android-build.ps1`
5. **Build APK**: `.\build-apk-final.ps1`

### Option 2: Use EAS Build (Cloud Build)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build APK in the cloud
eas build --platform android --profile preview
```

### Option 3: Use Expo Development Build
```bash
# Install Expo CLI
npm install -g @expo/cli

# Create development build
npx expo install expo-dev-client

# Build with Expo
npx expo run:android --variant release
```

## 🛠️ Manual Android SDK Setup

If you prefer to set up Android SDK manually:

### 1. Download Android SDK Command Line Tools
- Go to: https://developer.android.com/studio#command-tools
- Download "Command line tools only"
- Extract to `C:\Android\cmdline-tools`

### 2. Set Environment Variables
```cmd
setx ANDROID_HOME "C:\Android"
setx PATH "%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools"
```

### 3. Install SDK Components
```bash
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### 4. Create local.properties
Create `android/local.properties`:
```
sdk.dir=C:/Android
```

## 📋 Prerequisites Checklist

- [ ] **Java JDK 17** - Download from https://adoptium.net/
- [ ] **Node.js 18+** - Download from https://nodejs.org/
- [ ] **Android SDK** - Via Android Studio or manual setup
- [ ] **Git** - For version control

## 🔧 Build Scripts Available

1. **`setup-android-build.ps1`** - Automatic environment setup
2. **`build-apk-final.ps1`** - Complete APK build process
3. **`build-apk.bat`** - Windows batch build script
4. **`install-on-phone.bat`** - Install APK on connected device

## 🎯 Recommended Build Process

### Step 1: Environment Setup
```powershell
# Run the setup script
.\setup-android-build.ps1
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Prebuild
```bash
npx expo prebuild --clean --platform android
```

### Step 4: Build APK
```powershell
.\build-apk-final.ps1
```

## 📱 APK Installation

### Method 1: USB Installation
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device to computer
4. Run: `.\install-on-phone.bat`

### Method 2: Manual Installation
1. Copy APK file to your Android device
2. Enable "Install from Unknown Sources"
3. Open APK file and install

## 🚨 Troubleshooting

### Build Fails with "SDK not found"
- Install Android Studio or set ANDROID_HOME
- Run `.\setup-android-build.ps1`

### Java Version Issues
- Install JDK 17 from https://adoptium.net/
- Set JAVA_HOME environment variable

### Gradle Build Fails
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease --stacktrace
```

### Path with Spaces Issues
- Move project to path without spaces
- Or use PowerShell scripts instead of batch files

## 📊 Expected APK Details

- **App Name**: AceQuint (Furniture Expo)
- **Package**: com.acequint.app
- **Version**: 1.0.0
- **Size**: ~50-100 MB (estimated)
- **Min Android**: API 24 (Android 7.0)
- **Target Android**: API 35 (Android 15)

## 🔗 Useful Links

- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Developer Guide](https://developer.android.com/studio/build/building-cmdline)
- [EAS Build Service](https://expo.dev/eas)

## 💡 Pro Tips

1. **Use EAS Build** for easiest cloud-based building
2. **Install Android Studio** for complete development setup
3. **Test on real device** for best results
4. **Enable USB Debugging** for easier installation
5. **Keep SDK updated** for latest features

---

**Next Steps**: Choose your preferred setup method and follow the instructions above. The EAS Build option is recommended for beginners as it handles all the complexity in the cloud.
