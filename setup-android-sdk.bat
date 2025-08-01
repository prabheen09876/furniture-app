@echo off
echo Setting up Android SDK path...

echo Please enter the full path to your Android SDK (e.g., C:\Users\YourName\AppData\Local\Android\Sdk):
set /p SDK_PATH=

if not exist "%SDK_PATH%" (
    echo ERROR: The path you entered does not exist.
    echo Please run this script again with the correct path.
    goto :end
)

echo Creating local.properties file...
cd android
echo sdk.dir=%SDK_PATH% > local.properties
echo Created local.properties with:
type local.properties

echo.
echo Setting environment variables...
setx ANDROID_SDK_ROOT "%SDK_PATH%"
setx ANDROID_HOME "%SDK_PATH%"
echo Environment variables set.

:end
echo.
echo Press any key to exit...
pause > nul
