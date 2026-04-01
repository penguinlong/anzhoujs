@echo off
setlocal

set DIR=%~dp0
set JAVA_HOME=%DIR%..\..\..\..\..\..\Program Files\Java\jdk-21
if not exist "%JAVA_HOME%" set JAVA_HOME=

"%JAVA_HOME%\bin\java.exe" -version

endlocal
