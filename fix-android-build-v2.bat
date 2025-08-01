@echo off
echo ===================================================
echo Android Build Fix Script v2
echo ===================================================
echo.

echo Step 1: Detecting Android SDK location...
echo Checking common Android SDK locations...

set SDK_FOUND=0
set SDK_PATH=

REM Check common locations for Android SDK
if exist "C:\Users\ABHISHEK\AppData\Local\Android\Sdk" (
    set SDK_PATH=C:\Users\ABHISHEK\AppData\Local\Android\Sdk
    set SDK_FOUND=1
    echo Found Android SDK at: %SDK_PATH%
) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
    set SDK_PATH=%USERPROFILE%\AppData\Local\Android\Sdk
    set SDK_FOUND=1
    echo Found Android SDK at: %SDK_PATH%
) else if exist "C:\Android\Sdk" (
    set SDK_PATH=C:\Android\Sdk
    set SDK_FOUND=1
    echo Found Android SDK at: %SDK_PATH%
)

if %SDK_FOUND%==0 (
    echo ERROR: Android SDK not found in common locations.
    echo Please enter the full path to your Android SDK:
    set /p SDK_PATH=
    
    if not exist "%SDK_PATH%" (
        echo ERROR: The path you entered does not exist.
        echo Please run this script again with the correct path.
        goto :end
    )
)

echo.
echo Step 2: Setting environment variables...
set JAVA_HOME=
set ANDROID_SDK_ROOT=%SDK_PATH%
set ANDROID_HOME=%SDK_PATH%
echo Environment variables set:
echo ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%
echo ANDROID_HOME=%ANDROID_HOME%
echo.

echo Step 3: Creating local.properties file...
cd android
echo Creating local.properties with: sdk.dir=%SDK_PATH%
echo sdk.dir=%SDK_PATH% > local.properties
type local.properties
echo.

echo Step 4: Cleaning Gradle daemon...
call gradlew --stop
timeout /t 2 > nul
echo Gradle daemon stopped.
echo.

echo Step 5: Removing Gradle caches...
cd ..
rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul
rmdir /s /q "android\.gradle" 2>nul
rmdir /s /q "android\app\build" 2>nul
echo Gradle caches removed.
echo.

echo Step 6: Reinstalling node modules...
call npm install
echo Node modules reinstalled.
echo.

echo Step 7: Running React Native link...
call npx react-native-asset
echo React Native assets linked.
echo.

echo Step 8: Cleaning Android project...
cd android
call gradlew clean
echo Android project cleaned.
echo.

echo Step 9: Building Android release...
call gradlew assembleRelease --no-daemon --info
set BUILD_RESULT=%ERRORLEVEL%
echo.

if %BUILD_RESULT% EQU 0 (
  echo ===================================================
  echo Build SUCCESSFUL!
  echo APK location:
  echo android\app\build\outputs\apk\release\app-release.apk
  echo ===================================================
) else (
  echo ===================================================
  echo Build FAILED with error code %BUILD_RESULT%
  echo Please check the error messages above.
  echo ===================================================
)

:end
cd ..
echo.
echo Press any key to exit...
pause > nul
