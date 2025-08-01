#!/usr/bin/env pwsh

Write-Host "🚀 Building Furniture Expo APK with EAS (Cloud Build)" -ForegroundColor Green
Write-Host ""

# Set proper working directory
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
npm install -g @expo/eas-cli

Write-Host ""
Write-Host "Checking EAS login status..." -ForegroundColor Yellow

# Check if user is logged in
$loginCheck = eas whoami 2>&1
if ($loginCheck -match "Not logged in") {
    Write-Host "Please login to your Expo account:" -ForegroundColor Yellow
    eas login
} else {
    Write-Host "✅ Already logged in as: $loginCheck" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuring EAS build..." -ForegroundColor Yellow

# Check if eas.json exists
if (-not (Test-Path "eas.json")) {
    Write-Host "Creating EAS configuration..." -ForegroundColor Cyan
    eas build:configure
} else {
    Write-Host "✅ EAS configuration already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting cloud build..." -ForegroundColor Yellow
Write-Host "This will build your APK in the cloud (takes 5-15 minutes)" -ForegroundColor Cyan
Write-Host ""

# Start the build
eas build --platform android --profile preview --non-interactive

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "🎉 BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your APK has been built in the cloud!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To download your APK:" -ForegroundColor Cyan
    Write-Host "1. Check your email for the download link" -ForegroundColor White
    Write-Host "2. Or visit: https://expo.dev/accounts/[your-username]/projects/acequint-app/builds" -ForegroundColor White
    Write-Host "3. Or run: eas build:list" -ForegroundColor White
    Write-Host ""
    Write-Host "To install on your device:" -ForegroundColor Yellow
    Write-Host "1. Download the APK from the link" -ForegroundColor White
    Write-Host "2. Enable 'Install from Unknown Sources' on your Android device" -ForegroundColor White
    Write-Host "3. Install the APK file" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're logged into Expo: eas login" -ForegroundColor White
    Write-Host "2. Check your app.json configuration" -ForegroundColor White
    Write-Host "3. Try: eas build:configure" -ForegroundColor White
    Write-Host "4. Check build logs for specific errors" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
