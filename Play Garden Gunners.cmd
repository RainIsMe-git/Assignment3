@echo off
setlocal
title Garden Gunners - Game Launcher
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing_node
node "%~dp0scripts\launch.mjs"
if errorlevel 1 goto launch_failed
exit /b 0

:missing_node
echo Node.js was not found. Install Node.js 20 or newer, then double-click this file again.
echo No npm install is needed.
pause
exit /b 1

:launch_failed
echo.
echo The game could not start. See the message above, then try again.
pause
exit /b 1
