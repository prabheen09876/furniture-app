@echo off
echo Building Furniture Expo APK...
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install JDK 17 from https://adoptium.net/
    echo and set JAVA_HOME environment variable
    pause
    exit /b 1
)

echo Java found, proceeding with build...
echo.

REM Clean previous build
echo Cleaning previous build...
call android\gradlew.bat -p android clean

REM Build release APK
echo Building release APK...
call android\gradlew.bat -p android assembleRelease

if %errorlevel% equ 0 (
    echo.
    echo ✅ BUILD SUCCESSFUL!
    echo.
    echo APK location: android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo You can now install this APK on your Android device.
    echo Make sure to enable "Install from Unknown Sources" in your device settings.
    echo.
) else (
    echo.
    echo ❌ BUILD FAILED!
    echo Check the error messages above for details.
    echo.
)

pause
