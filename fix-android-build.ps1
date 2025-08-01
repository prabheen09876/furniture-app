# Android Build Fix PowerShell Script
Write-Host "===================================================`nAndroid Build Fix Script`n===================================================" -ForegroundColor Cyan

# Step 1: Detect Android SDK location
Write-Host "`nStep 1: Detecting Android SDK location..." -ForegroundColor Green

# Common locations to check
$commonLocations = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "D:\Android\Sdk",
    "$env:ProgramFiles\Android\Sdk",
    "$env:ProgramFiles(x86)\Android\Sdk"
)

$sdkPath = $null
foreach ($location in $commonLocations) {
    if (Test-Path $location) {
        $sdkPath = $location
        Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Green
        break
    }
}

if (-not $sdkPath) {
    Write-Host "Android SDK not found in common locations." -ForegroundColor Yellow
    Write-Host "Please enter the full path to your Android SDK:" -ForegroundColor Yellow
    $sdkPath = Read-Host
    
    if (-not (Test-Path $sdkPath)) {
        Write-Host "ERROR: The path you entered does not exist." -ForegroundColor Red
        Write-Host "Please run this script again with the correct path." -ForegroundColor Red
        exit 1
    }
}

# Step 2: Set environment variables
Write-Host "`nStep 2: Setting environment variables..." -ForegroundColor Green
$env:ANDROID_SDK_ROOT = $sdkPath
$env:ANDROID_HOME = $sdkPath
Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "ANDROID_SDK_ROOT=$env:ANDROID_SDK_ROOT" -ForegroundColor White
Write-Host "ANDROID_HOME=$env:ANDROID_HOME" -ForegroundColor White

# Step 3: Create local.properties file
Write-Host "`nStep 3: Creating local.properties file..." -ForegroundColor Green
$localPropertiesPath = ".\android\local.properties"
$sdkPathFormatted = $sdkPath.Replace("\", "\\")
"sdk.dir=$sdkPathFormatted" | Out-File -FilePath $localPropertiesPath -Encoding ASCII
Write-Host "Created local.properties with content:" -ForegroundColor Green
Get-Content $localPropertiesPath

# Step 4: Clean Gradle daemon
Write-Host "`nStep 4: Cleaning Gradle daemon..." -ForegroundColor Green
Push-Location android
.\gradlew --stop
Start-Sleep -Seconds 2
Pop-Location
Write-Host "Gradle daemon stopped." -ForegroundColor Green

# Step 5: Remove Gradle caches
Write-Host "`nStep 5: Removing Gradle caches..." -ForegroundColor Green
if (Test-Path "$env:USERPROFILE\.gradle\daemon") {
    Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\daemon" -ErrorAction SilentlyContinue
}
if (Test-Path ".\android\.gradle") {
    Remove-Item -Recurse -Force ".\android\.gradle" -ErrorAction SilentlyContinue
}
if (Test-Path ".\android\app\build") {
    Remove-Item -Recurse -Force ".\android\app\build" -ErrorAction SilentlyContinue
}
Write-Host "Gradle caches removed." -ForegroundColor Green

# Step 6: Reinstall node modules
Write-Host "`nStep 6: Reinstalling node modules..." -ForegroundColor Green
npm install
Write-Host "Node modules reinstalled." -ForegroundColor Green

# Step 7: Run React Native link
Write-Host "`nStep 7: Running React Native link..." -ForegroundColor Green
npx react-native-asset
Write-Host "React Native assets linked." -ForegroundColor Green

# Step 8: Clean Android project
Write-Host "`nStep 8: Cleaning Android project..." -ForegroundColor Green
Push-Location android
.\gradlew clean
Pop-Location
Write-Host "Android project cleaned." -ForegroundColor Green

# Step 9: Fix missing module dependency
Write-Host "`nStep 9: Fixing React Native Async Storage dependency..." -ForegroundColor Green
$settingsGradlePath = ".\android\settings.gradle"
$settingsContent = Get-Content $settingsGradlePath -Raw

# Check if we need to add the dependency
if (-not ($settingsContent -match "@react-native-async-storage/async-storage")) {
    Write-Host "Adding @react-native-async-storage/async-storage to settings.gradle..." -ForegroundColor Yellow
    $newLine = "`ninclude ':@react-native-async-storage_async-storage'"
    $newLine += "`nproject(':@react-native-async-storage_async-storage').projectDir = new File(rootProject.projectDir, '../node_modules/@react-native-async-storage/async-storage/android')"
    Add-Content -Path $settingsGradlePath -Value $newLine
    Write-Host "Added missing dependency to settings.gradle." -ForegroundColor Green
} else {
    Write-Host "React Native Async Storage dependency already exists in settings.gradle." -ForegroundColor Green
}

# Step 10: Build Android release
Write-Host "`nStep 10: Building Android release..." -ForegroundColor Green
Push-Location android
$buildProcess = Start-Process -FilePath ".\gradlew.bat" -ArgumentList "assembleRelease", "--info" -NoNewWindow -PassThru -Wait
$buildResult = $buildProcess.ExitCode
Pop-Location

if ($buildResult -eq 0) {
    Write-Host "`n===================================================" -ForegroundColor Green
    Write-Host "Build SUCCESSFUL!" -ForegroundColor Green
    Write-Host "APK location:" -ForegroundColor Green
    Write-Host "android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
    Write-Host "===================================================" -ForegroundColor Green
} else {
    Write-Host "`n===================================================" -ForegroundColor Red
    Write-Host "Build FAILED with error code $buildResult" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Write-Host "===================================================" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
