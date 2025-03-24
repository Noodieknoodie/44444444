@echo off
echo Running 401k Payment Management Tests...
echo.

:: Set the PYTHONPATH to include the project root
set "PYTHONPATH=%CD%"
echo Setting PYTHONPATH to: %PYTHONPATH%

:: Check if the virtual environment exists
if exist backend\env\Scripts\activate.bat (
    :: Activate the virtual environment
    echo Activating virtual environment...
    call backend\env\Scripts\activate.bat
    
    :: Install test dependencies if needed
    pip install fastapi[test] pytest pytest-cov

    :: Run the database connection test first
    echo.
    echo Running database connection test...
    echo ------------------------------
    python backend\tests\test_db_connection.py -v
    
    :: Run the API endpoint tests
    echo.
    echo Running API endpoint tests...
    echo ------------------------------
    python backend\tests\test_api_endpoints.py -v
    
    :: Run all tests with pytest for coverage report
    echo.
    echo Running all tests with coverage...
    echo ------------------------------
    pytest backend\tests --cov=backend -v
    
    :: Deactivate the virtual environment
    call deactivate
) else (
    echo ERROR: Virtual environment not found!
    echo Please run setup_guide.md instructions first.
)

echo.
echo Press any key to exit...
pause > nul 