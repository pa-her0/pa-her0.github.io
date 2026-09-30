@echo off
setlocal
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\pnpm;%PATH%"

echo Automatic blog publishing is running every 5 minutes.
echo Only saved changes are included. Press Ctrl+C to stop.
echo Log: %LOCALAPPDATA%\JielyBlogStudio\auto-publish.log
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\auto-publish-blog.ps1" -IntervalSeconds 300 %*
set "auto_publish_exit=%ERRORLEVEL%"

if not "%auto_publish_exit%"=="0" (
  echo.
  echo Automatic publishing stopped because of a startup error.
  pause
)

exit /b %auto_publish_exit%
