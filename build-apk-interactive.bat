@echo off
echo.
echo ========================================
echo   Furniture Expo APK Builder
echo ========================================
echo.

echo Choose your build method:
echo.
echo 1. EAS Build (Cloud Build) - RECOMMENDED
echo 2. Local Build (Requires Android SDK)
echo 3. Show detailed instructions
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto eas_build
if "%choice%"=="2" goto local_build
if "%choice%"=="3" goto show_instructions
if "%choice%"=="4" goto exit
goto invalid_choice

:eas_build
echo.
echo Starting EAS Build (Cloud Build)...
echo.
echo This will build your APK in the cloud.
echo You'll need to be logged into Expo.
echo.
pause

echo Installing dependencies...
npm install

echo.
echo Configuring EAS project...
echo When prompted, answer YES to create a new EAS project.
echo.
pause

powershell -ExecutionPolicy Bypass -Command "eas build:configure"

if %errorlevel% equ 0 (
    echo.
    echo Configuration successful! Starting build...
    echo.
    powershell -ExecutionPolicy Bypass -Command "eas build --platform android --profile preview"
    
    if %errorlevel% equ 0 (
        echo.
        echo ✅ BUILD SUCCESSFUL!
        echo.
        echo Your APK has been built in the cloud.
        echo Check your email or Expo dashboard for the download link.
        echo.
    ) else (
        echo.
        echo ❌ Build failed. Check the error messages above.
        echo.
    )
) else (
    echo.
    echo ❌ Configuration failed. Please check the error messages.
    echo.
)
goto end

:local_build
echo.
echo Starting Local Build...
echo.
echo This requires Android SDK to be installed.
echo.

if exist "android\local.properties" (
    echo Android SDK configuration found.
) else (
    echo Setting up Android SDK configuration...
    powershell -ExecutionPolicy Bypass -File "setup-android-build.ps1"
)

echo.
echo Building APK locally...
powershell -ExecutionPolicy Bypass -File "build-apk-final.ps1"
goto end

:show_instructions
echo.
echo Opening detailed instructions...
notepad BUILD_APK_SOLUTIONS.md
goto menu

:invalid_choice
echo.
echo Invalid choice. Please enter 1, 2, 3, or 4.
echo.
goto menu

:menu
echo.
set /p choice="Enter your choice (1-4): "
if "%choice%"=="1" goto eas_build
if "%choice%"=="2" goto local_build
if "%choice%"=="3" goto show_instructions
if "%choice%"=="4" goto exit
goto invalid_choice

:end
echo.
echo Build process completed.
echo.

:exit
pause
