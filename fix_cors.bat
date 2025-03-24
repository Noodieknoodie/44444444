@echo off
echo Fixing CORS issues for 401k Application...
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
    cd backend
    call env\Scripts\activate.bat
    
    :: Restart the backend server with proper CORS configuration
    echo Starting backend server with correct CORS configuration...
    echo.
    echo ******************************************************
    echo * Frontend should be running at http://localhost:3000 *
    echo * Backend will be at http://localhost:8000           *
    echo ******************************************************
    echo.
    
    python -m uvicorn main:app --reload
    
    :: Deactivate when done
    call deactivate
    cd ..
) else (
    echo ERROR: Virtual environment not found!
    echo Please run setup_guide.md instructions first.
)

echo.
echo Press any key to exit...
pause > nul 