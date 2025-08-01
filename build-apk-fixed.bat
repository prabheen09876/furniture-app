@echo off
echo Building Furniture Expo APK (Fixed Version)...
echo.

REM Set proper environment variables
set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
set JAVA_HOME=%JAVA_HOME%
set PATH=%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%JAVA_HOME%\bin;%PATH%

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

REM Navigate to project directory
cd /d "%~dp0"

REM Clean previous build
echo Cleaning previous build...
call android\gradlew.bat -p android clean --stacktrace

REM Check if clean was successful
if %errorlevel% neq 0 (
    echo Clean failed, trying alternative approach...
    rmdir /s /q android\app\build 2>nul
    rmdir /s /q android\build 2>nul
)

echo.
echo Building release APK...

REM Try building with different approaches
echo Attempting build method 1: Direct Gradle...
call android\gradlew.bat -p android assembleRelease --stacktrace --info

if %errorlevel% neq 0 (
    echo.
    echo Method 1 failed, trying method 2: Expo build...
    npx expo run:android --variant release
)

if %errorlevel% neq 0 (
    echo.
    echo Method 2 failed, trying method 3: Manual build...
    cd android
    call gradlew.bat assembleRelease --stacktrace
    cd ..
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ BUILD SUCCESSFUL!
    echo.
    echo Searching for APK files...
    
    REM Find the APK file
    for /r android\app\build\outputs\apk %%i in (*.apk) do (
        echo Found APK: %%i
        echo.
        echo APK Size: 
        dir "%%i" | findstr /C:"%%~nxi"
        echo.
    )
    
    echo You can now install this APK on your Android device.
    echo Make sure to enable "Install from Unknown Sources" in your device settings.
    echo.
) else (
    echo.
    echo ❌ BUILD FAILED!
    echo.
    echo Troubleshooting steps:
    echo 1. Make sure Android SDK is properly installed
    echo 2. Check that JAVA_HOME is set to JDK 17
    echo 3. Try running: npx expo install --fix
    echo 4. Try running: npx expo prebuild --clean
    echo.
)

pause
