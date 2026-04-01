@echo off
echo.
echo ========================================
echo   Healthcare Uncharted — Deploying...
echo ========================================
echo.
cd /d "C:\Users\david\Documents\Healthcare_Uncharted_Site"
netlify deploy --prod --dir . --site 12eaf952-2778-4cfd-bb00-a7d2cc2ef0c4
echo.
echo ========================================
echo   Done! Your site is live.
echo   https://healthcareuncharted.com
echo ========================================
echo.
pause
