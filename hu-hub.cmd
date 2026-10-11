@echo off
rem HU hub. Starts the hub on this computer and opens it in the browser.
rem Double-click this file, or put a shortcut to it on the desktop.
rem The hub is the board, the run sheet and the QA list. It never ships: scripts/hub/.
cd /d "%~dp0"
if not exist "_site\index.html" (
  echo Building the site first. This takes about a minute.
  call npm run build
)
rem If the hub is already running, the second copy says so and stops; the browser opens either way.
start "HU hub" /min cmd /c "node scripts\review.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8081/__hub"
