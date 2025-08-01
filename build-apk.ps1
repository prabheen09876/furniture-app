#!/usr/bin/env pwsh

Write-Host "Building Furniture Expo APK..." -ForegroundColor Green
Write-Host ""

# Set proper working directory
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "Project directory: $ProjectRoot" -ForegroundColor Yellow
Write-Host ""

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1
    Write-Host "Java found: $($javaVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Java is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install JDK 17 from https://adoptium.net/" -ForegroundColor Yellow
    Write-Host "and set JAVA_HOME environment variable" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Installing/updating dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Prebuilding project..." -ForegroundColor Yellow
npx expo prebuild --clean --platform android

Write-Host ""
Write-Host "Building release APK..." -ForegroundColor Yellow

# Method 1: Try Expo build
Write-Host "Attempting Expo build..." -ForegroundColor Cyan
$expoResult = npx expo run:android --variant release --no-install --no-bundler
$expoExitCode = $LASTEXITCODE

if ($expoExitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Expo build failed, trying direct Gradle build..." -ForegroundColor Yellow
    
    # Method 2: Direct Gradle build
    Set-Location "android"
    
    Write-Host "Cleaning previous build..." -ForegroundColor Cyan
    .\gradlew.bat clean
    
    Write-Host "Building release APK..." -ForegroundColor Cyan
    .\gradlew.bat assembleRelease
    
    $gradleExitCode = $LASTEXITCODE
    Set-Location ".."
    
    if ($gradleExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "1. Make sure Android SDK is properly installed" -ForegroundColor White
        Write-Host "2. Check that JAVA_HOME is set to JDK 17" -ForegroundColor White
        Write-Host "3. Try running: npx expo install --fix" -ForegroundColor White
        Write-Host "4. Check Android SDK path in local.properties" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Find and display APK location
Write-Host ""
Write-Host "Searching for APK files..." -ForegroundColor Yellow

$apkFiles = Get-ChildItem -Path "android\app\build\outputs\apk" -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue

if ($apkFiles) {
    foreach ($apk in $apkFiles) {
        Write-Host ""
        Write-Host "Found APK: $($apk.FullName)" -ForegroundColor Green
        Write-Host "APK Size: $([math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "🎉 APK build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation instructions:" -ForegroundColor Yellow
    Write-Host "1. Transfer the APK file to your Android device" -ForegroundColor White
    Write-Host "2. Enable 'Install from Unknown Sources' in device settings" -ForegroundColor White
    Write-Host "3. Open the APK file on your device to install" -ForegroundColor White
} else {
    Write-Host "No APK files found. Build may have failed." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
