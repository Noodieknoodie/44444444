@echo off 
cd /d "%%~dp0backend" 
call venv\Scripts\activate.bat 
uvicorn main:app --port 6069 
pause
