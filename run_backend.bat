@echo off
cd backend
call env\Scripts\activate.bat
set PYTHONPATH=%CD%
uvicorn app.main:app --reload
