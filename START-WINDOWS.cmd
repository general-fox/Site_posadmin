@echo off
setlocal
cd /d "%~dp0"
title POSADMIN - local website

where node >nul 2>&1
if errorlevel 1 goto missing_node
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major===24 && minor>=15 ? 0 : 1)"
if errorlevel 1 goto missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto missing_node

echo Installing the exact project dependencies. Internet is required.
call npm.cmd ci --no-audit --no-fund
if errorlevel 1 goto failed

echo.
echo When Ready appears, open http://127.0.0.1:3000 in your browser.
echo Keep this window open. Press Ctrl+C to stop the website.
echo.
call npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
if errorlevel 1 goto failed
exit /b 0

:missing_node
echo.
echo Install Node.js 24 LTS, version 24.15.0 or newer in the 24.x branch:
echo https://nodejs.org/en/download
echo Then close this window and run START-WINDOWS.cmd again.
pause
exit /b 1

:failed
echo.
echo The website could not start. See the error above and README.md.
echo Check your internet connection and whether port 3000 is already in use.
pause
exit /b 1
