@echo off
setlocal
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\pnpm;%PATH%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish-blog.ps1" %*
set "publish_exit=%ERRORLEVEL%"
echo.
if not "%publish_exit%"=="0" (
  echo Publish failed. Read the error above.
) else (
  echo Publish command finished.
)
pause
exit /b %publish_exit%
