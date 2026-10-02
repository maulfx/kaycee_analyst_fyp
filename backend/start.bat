@echo off
echo ===================================================
echo   Kaycee_AnalystFYP - Backend Server
echo ===================================================
echo Starting FastAPI server on http://localhost:8000
echo Dashboard available at: http://localhost:8000
echo Swagger API docs at: http://localhost:8000/docs
echo ===================================================
uv run --with fastapi,uvicorn,yt-dlp,pydantic uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
