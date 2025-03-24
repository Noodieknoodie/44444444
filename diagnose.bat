@echo off
echo Running 401k Application Diagnostic Tool...
echo.

:: Set the PYTHONPATH to include the project root
set "PYTHONPATH=%CD%"

:: Check if the virtual environment exists
if exist backend\env\Scripts\activate.bat (
    :: Activate the virtual environment
    call backend\env\Scripts\activate.bat
    
    :: Check if requests module is installed
    python -c "import requests" 2>nul
    if errorlevel 1 (
        echo Installing required packages...
        pip install requests
    )
    
    :: Run the diagnostic script
    python backend\api_diagnostic.py
    
    :: Deactivate the virtual environment
    call deactivate
) else (
    echo Virtual environment not found!
    echo Please run setup first.
)

echo.
echo Press any key to exit...
pause > nul 