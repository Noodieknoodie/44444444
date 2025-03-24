@echo off
echo Starting 401k Management System...

:: Set up PYTHONPATH to include the project root
set "PYTHONPATH=%CD%"
echo Python path set to: %PYTHONPATH%

:: Start the backend
cd backend
if exist env\Scripts\activate.bat (
    call env\Scripts\activate.bat
) else (
    echo Creating virtual environment...
    python -m venv env
    call env\Scripts\activate.bat
    pip install -r ..\requirements.txt
)

:: Start FastAPI in a new window
start cmd /k "title 401k Backend && set PYTHONPATH=%PYTHONPATH% && python -m uvicorn main:app --reload"

:: Start the frontend
cd ..\frontend
start cmd /k "title 401k Frontend && npm run dev"

echo All systems launched!