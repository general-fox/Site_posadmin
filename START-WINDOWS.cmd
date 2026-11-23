@echo off
setlocal
cd /d "%~dp0" || goto invalid_path
if not exist "package.json" goto invalid_path
title POSADMIN - local website

set "POSADMIN_NODE="
for /f "delims=" %%N in ('where.exe node.exe 2^>nul') do call :use_supported_node "%%N"
if not defined POSADMIN_NODE goto missing_node

if exist "node_modules\next\dist\bin\next" goto serve
for %%N in ("%POSADMIN_NODE%") do set "POSADMIN_NPM=%%~dpNnode_modules\npm\bin\npm-cli.js"
if not exist "%POSADMIN_NPM%" for %%N in ("%POSADMIN_NODE%") do set "POSADMIN_NPM=%%~dpN..\node_modules\npm\bin\npm-cli.js"
if not exist "%POSADMIN_NPM%" goto missing_npm
echo Installing project dependencies. Internet is required for this step.
"%POSADMIN_NODE%" "%POSADMIN_NPM%" ci --no-audit --no-fund
if errorlevel 1 goto failed

:serve
set "POSADMIN_PREVIEW_DIST_DIR=.next-preview-3100"
echo.
echo When Ready appears, open http://127.0.0.1:3100 in your browser.
echo Keep this window open. Press Ctrl+C to stop the website.
echo.
"%POSADMIN_NODE%" "node_modules\next\dist\bin\next" dev --hostname 127.0.0.1 --port 3100
if errorlevel 1 goto failed
exit /b 0

:use_supported_node
if defined POSADMIN_NODE exit /b 0
"%~1" -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major===24 && minor>=15 ? 0 : 1)" >nul 2>&1
if not errorlevel 1 set "POSADMIN_NODE=%~1"
exit /b 0

:missing_node
echo.
echo Install Node.js 24 LTS, version 24.15.0 or newer in the 24.x branch:
echo https://nodejs.org/en/download
echo Then close this window and run START-WINDOWS.cmd again.
pause
exit /b 1

:missing_npm
echo.
echo The installed Node.js does not include npm. Install Node.js 24 LTS with npm to install dependencies.
pause
exit /b 1

:failed
echo.
echo The website could not start. See the error above and README.md.
echo Check your internet connection and whether port 3100 is already in use.
pause
exit /b 1

:invalid_path
echo.
echo Extract the entire archive into a local folder, then run this file again.
echo The project folder could not be opened. No dependencies were installed.
pause
exit /b 1
