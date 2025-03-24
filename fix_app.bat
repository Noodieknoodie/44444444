@echo off
echo 401k Application AUTO-FIX TOOL
echo =============================
echo.

:: Set the PYTHONPATH to include the project root
set "PYTHONPATH=%CD%"
echo Setting PYTHONPATH to: %PYTHONPATH%

:: Stop any running uvicorn instances
echo Stopping any running uvicorn instances...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq 401k Backend" 2>nul

:: Check if the virtual environment exists
if exist backend\env\Scripts\activate.bat (
    :: Activate the virtual environment
    echo Activating virtual environment...
    call backend\env\Scripts\activate.bat
    
    :: Install/update any missing packages
    echo Ensuring all dependencies are installed...
    pip install -r backend\requirements.txt
    pip install requests
    
    :: Restart the backend server with proper PYTHONPATH
    echo Starting backend server with correct configuration...
    start cmd /k "title 401k Backend && set PYTHONPATH=%PYTHONPATH% && cd backend && python -m uvicorn main:app --reload"
    
    :: Wait for the server to start
    echo Waiting for the server to start (5 seconds)...
    timeout /t 5 /nobreak > nul
    
    :: Run the diagnostic to verify
    echo Running diagnostic to verify the fix...
    python backend\api_diagnostic.py
    
    echo.
    echo Fix completed! If diagnostics show errors, please check the suggestions above.
    
) else (
    echo ERROR: Virtual environment not found!
    echo Please run setup_guide.md instructions first.
)

echo.
echo Press any key to exit...
pause > nul 