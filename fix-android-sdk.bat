@echo off
echo ===================================================
echo Android SDK Path Fix
echo ===================================================
echo.

echo This script will help you set up the Android SDK path correctly.
echo.

echo Please enter the full path to your Android SDK:
echo (Example: C:\Users\ABHISHEK\AppData\Local\Android\Sdk)
set /p SDK_PATH=

echo.
echo Verifying path exists...
if not exist "%SDK_PATH%" (
    echo ERROR: The path you entered does not exist.
    echo Please run this script again with the correct path.
    goto :end
)

echo Path verified successfully!
echo.

echo Creating local.properties file...
echo sdk.dir=%SDK_PATH:\=\\% > android\local.properties
echo Created local.properties with content:
type android\local.properties
echo.

echo Now you can build your Android app using:
echo npx expo run:android --variant release
echo.

:end
pause
