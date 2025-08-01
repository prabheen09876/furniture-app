@echo off
echo ===================================================
echo Android Build Fix Script
echo ===================================================
echo.

echo Step 1: Setting environment variables...
set JAVA_HOME=
set ANDROID_SDK_ROOT=C:\Users\ABHISHEK\AppData\Local\Android\Sdk
set ANDROID_HOME=C:\Users\ABHISHEK\AppData\Local\Android\Sdk
echo Environment variables set.
echo.

echo Step 2: Creating local.properties file...
cd android
echo sdk.dir=C:\\Users\\ABHISHEK\\AppData\\Local\\Android\\Sdk > local.properties
echo local.properties created.
echo.

echo Step 3: Cleaning Gradle daemon...
call gradlew --stop
timeout /t 2 > nul
echo Gradle daemon stopped.
echo.

echo Step 4: Removing Gradle caches...
cd ..
rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul
rmdir /s /q "android\.gradle" 2>nul
rmdir /s /q "android\app\build" 2>nul
echo Gradle caches removed.
echo.

echo Step 5: Reinstalling node modules...
call npm install
echo Node modules reinstalled.
echo.

echo Step 6: Running React Native link...
call npx react-native-asset
echo React Native assets linked.
echo.

echo Step 7: Cleaning Android project...
cd android
call gradlew clean
echo Android project cleaned.
echo.

echo Step 8: Building Android release...
call gradlew assembleRelease --no-daemon
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

cd ..
echo.
echo Press any key to exit...
pause > nul
