@echo off
echo ========================================
echo KTET Quiz - Starting Development Servers
echo ========================================
echo.

REM Kill any existing processes on ports 3001 and 5173
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend API Server (Port 3001)...
start "KTET API Server" cmd /k "npm run dev:api"
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Dev Server (Port 5173)...
start "KTET Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Servers are starting!
echo ========================================
echo Backend API: http://localhost:3001
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Wait a few seconds, then open:
echo http://localhost:5173
echo.
pause
