@echo off
REM Replace this path with your actual JDK 17 installation path
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java:
java -version
echo.

cd android
call gradlew assembleRelease

pause
