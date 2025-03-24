@echo off
echo Starting 401k Backend with fixed imports...

:: Activate the virtual environment
call env\Scripts\activate.bat

:: Start the FastAPI server with the correct working directory
python -m uvicorn main:app --reload

:: This script should be run from the backend directory 