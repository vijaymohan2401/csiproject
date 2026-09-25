@echo off
echo =======================================================================
echo Starting SereneCampus Backend Server
echo Problem Statement: Stress Levels and Coping Mechanisms of College Students
echo =======================================================================
echo.
cd /d "%~dp0"
python -m uvicorn backend.main:socket_app --host 127.0.0.1 --port 8000 --reload
pause
