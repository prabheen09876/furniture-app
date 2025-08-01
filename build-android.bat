@echo off
echo Using Java version:
java --version
echo.

echo Cleaning Gradle daemon...
cd android
call gradlew --stop
timeout /t 2 > nul

echo Removing Gradle daemon cache...
rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul
echo.

echo Setting environment variables...
set JAVA_HOME=
set ANDROID_SDK_ROOT=C:\Users\ABHISHEK\AppData\Local\Android\Sdk
set ANDROID_HOME=C:\Users\ABHISHEK\AppData\Local\Android\Sdk
echo.

echo Creating local.properties file...
echo sdk.dir=C:\Users\ABHISHEK\AppData\Local\Android\Sdk > local.properties
echo.

echo Installing node modules...
cd ..
npm install

echo Running React Native link...
npx react-native-asset

echo Navigating back to Android directory...
cd android

echo Building Android app...
call gradlew clean
echo.
echo Starting release build...
call gradlew assembleRelease --no-daemon

echo.
if %ERRORLEVEL% EQU 0 (
  echo Build SUCCESSFUL!
  echo APK location:
  echo android\app\build\outputs\apk\release\app-release.apk
) else (
  echo Build FAILED with error code %ERRORLEVEL%
)
pause
