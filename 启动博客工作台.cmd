@echo off
cd /d "%~dp0"
where pnpm >nul 2>nul
if errorlevel 1 (
  echo Could not find pnpm. Please install the project environment first.
  pause
  exit /b 1
)
pnpm studio
