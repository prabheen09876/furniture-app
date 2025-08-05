#!/bin/bash

# Android Image Upload Fix Installation Script
# This script installs the necessary dependencies and rebuilds the project

echo "🔧 Installing Android Image Upload Fix..."
echo "========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if npm or yarn is available
if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
else
    echo "❌ Error: Neither npm nor yarn found. Please install one of them first."
    exit 1
fi

echo "📦 Using package manager: $PACKAGE_MANAGER"

# Install dependencies
echo "📥 Installing dependencies..."
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    yarn install
else
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies."
    exit 1
fi

echo "✅ Dependencies installed successfully!"

# Check if expo CLI is available
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI not found. Installing globally..."
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn global add @expo/cli
    else
        npm install -g @expo/cli
    fi
fi

# Clean and prebuild
echo "🧹 Cleaning and rebuilding project..."
npx expo prebuild --clean

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to prebuild project."
    exit 1
fi

echo "✅ Project rebuilt successfully!"

# Display next steps
echo ""
echo "🎉 Android Image Upload Fix installed successfully!"
echo "=================================================="
echo ""
echo "📱 Next steps:"
echo "1. To test locally:"
echo "   npx expo run:android"
echo ""
echo "2. To build APK for production:"
echo "   eas build --platform android"
echo ""
echo "3. To build for both platforms:"
echo "   eas build --platform all"
echo ""
echo "📋 What was fixed:"
echo "• Added expo-image-manipulator for better image processing"
echo "• Implemented multi-tier fallback system for Android compatibility"
echo "• Added automatic image compression and format normalization"
echo "• Improved error handling and user feedback"
echo ""
echo "📖 For more details, see ANDROID_IMAGE_UPLOAD_FIX.md"

# Check if EAS is configured
if [ ! -f "eas.json" ]; then
    echo ""
    echo "⚠️  Note: eas.json found. You can now build with EAS Build."
else
    echo ""
    echo "⚠️  Note: To use EAS Build, you may need to configure it first:"
    echo "   eas build:configure"
fi

echo ""
echo "✨ Ready to test image uploads on Android!"
