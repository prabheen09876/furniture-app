#!/usr/bin/env pwsh

Write-Host "Setting up Android build environment..." -ForegroundColor Green
Write-Host ""

# Set proper working directory
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# Common Android SDK locations
$AndroidSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "C:\Program Files (x86)\Android\android-sdk"
)

$AndroidSdkPath = $null

Write-Host "Searching for Android SDK..." -ForegroundColor Yellow

foreach ($path in $AndroidSdkPaths) {
    if ($path -and (Test-Path $path)) {
        $platformToolsPath = Join-Path $path "platform-tools"
        if (Test-Path $platformToolsPath) {
            $AndroidSdkPath = $path
            Write-Host "Found Android SDK at: $AndroidSdkPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $AndroidSdkPath) {
    Write-Host "Android SDK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android Studio or Android SDK:" -ForegroundColor Yellow
    Write-Host "1. Download Android Studio from https://developer.android.com/studio" -ForegroundColor White
    Write-Host "2. Install Android Studio and let it install the SDK" -ForegroundColor White
    Write-Host "3. Or manually set ANDROID_HOME environment variable" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Create local.properties file
$LocalPropertiesPath = "android\local.properties"
$LocalPropertiesContent = @"
# This file was automatically generated
# Location of the Android SDK
sdk.dir=$($AndroidSdkPath -replace '\\', '/')
"@

Write-Host "Creating local.properties file..." -ForegroundColor Yellow
$LocalPropertiesContent | Out-File -FilePath $LocalPropertiesPath -Encoding UTF8
Write-Host "Created: $LocalPropertiesPath" -ForegroundColor Green

# Check Java version
Write-Host ""
Write-Host "Checking Java installation..." -ForegroundColor Yellow

try {
    $javaVersion = java -version 2>&1
    $javaVersionString = $javaVersion[0].ToString()
    Write-Host "Java found: $javaVersionString" -ForegroundColor Green
    
    # Check if it's Java 17
    if ($javaVersionString -match "17\.") {
        Write-Host "✅ Java 17 detected - Good!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Java 17 is recommended for React Native" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Java not found!" -ForegroundColor Red
    Write-Host "Please install JDK 17 from https://adoptium.net/" -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway"
}

# Check Node.js
Write-Host ""
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ Android build environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Run: npx expo prebuild --clean" -ForegroundColor White
Write-Host "3. Run: .\build-apk-final.ps1" -ForegroundColor White
Write-Host ""

# Create the final build script
$BuildScriptContent = @'
#!/usr/bin/env pwsh

Write-Host "Building Furniture Expo APK..." -ForegroundColor Green
Write-Host ""

# Set proper working directory
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Cleaning and prebuilding..." -ForegroundColor Yellow
npx expo prebuild --clean --platform android

Write-Host ""
Write-Host "Building release APK..." -ForegroundColor Yellow

# Navigate to android directory and build
Set-Location "android"

Write-Host "Cleaning previous build..." -ForegroundColor Cyan
.\gradlew.bat clean

Write-Host "Building release APK..." -ForegroundColor Cyan
.\gradlew.bat assembleRelease --stacktrace

$exitCode = $LASTEXITCODE
Set-Location ".."

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    
    # Find and display APK
    $apkFiles = Get-ChildItem -Path "android\app\build\outputs\apk" -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue
    
    if ($apkFiles) {
        Write-Host ""
        Write-Host "APK files created:" -ForegroundColor Yellow
        foreach ($apk in $apkFiles) {
            Write-Host "📱 $($apk.FullName)" -ForegroundColor Green
            Write-Host "   Size: $([math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "🎉 Success! Your APK is ready for installation." -ForegroundColor Green
        Write-Host ""
        Write-Host "To install on your device:" -ForegroundColor Yellow
        Write-Host "1. Enable 'Developer Options' on your Android device" -ForegroundColor White
        Write-Host "2. Enable 'USB Debugging' and 'Install via USB'" -ForegroundColor White
        Write-Host "3. Transfer the APK to your device and install" -ForegroundColor White
        Write-Host "   OR" -ForegroundColor Cyan
        Write-Host "4. Connect device via USB and run: .\install-on-phone.bat" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure Android SDK is properly installed" -ForegroundColor White
    Write-Host "2. Check that local.properties has correct SDK path" -ForegroundColor White
    Write-Host "3. Try: npx expo install --fix" -ForegroundColor White
    Write-Host "4. Try: npx expo doctor" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
'@

$BuildScriptContent | Out-File -FilePath "build-apk-final.ps1" -Encoding UTF8
Write-Host "Created build script: build-apk-final.ps1" -ForegroundColor Green

Write-Host ""
Read-Host "Press Enter to continue"
