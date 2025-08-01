@echo off
echo ===================================================
echo    AceQuint App - Install with Expo Go
echo ===================================================
echo.
echo This script will help you run AceQuint on your Android phone
echo using Expo Go, which doesn't require Java or Android SDK.
echo.
echo Steps:
echo 1. Install Expo Go app from Google Play Store on your phone
echo 2. Make sure your phone and computer are on the same WiFi network
echo 3. This script will start a development server
echo 4. Scan the QR code with your phone's camera or Expo Go app
echo.
echo Press any key to start the server...
pause > nul

echo.
echo Starting Expo development server...
echo.

REM Kill any processes using port 8081 or 8082
echo Freeing up ports for Expo...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8081') DO (
  taskkill /PID %%P /F >nul 2>&1
)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8082') DO (
  taskkill /PID %%P /F >nul 2>&1
)

echo Starting Expo server with tunnel option...
npx expo start --tunnel
