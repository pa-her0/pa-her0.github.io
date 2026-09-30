@echo off
setlocal
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\pnpm;%PATH%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-blog-studio.ps1" -IntervalSeconds 300
set "studio_exit=%ERRORLEVEL%"

if not "%studio_exit%"=="0" (
  echo.
  echo Blog workbench stopped because of an error.
  pause
)

exit /b %studio_exit%
