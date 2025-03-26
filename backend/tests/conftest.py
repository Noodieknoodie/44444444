
import pytest
import sqlite3
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add the parent directory to the path to import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

@pytest.fixture
def client():
    """
    Create a TestClient for FastAPI app testing
    """
    return TestClient(app)

@pytest.fixture
def db_connection():
    """
    Create a direct database connection for testing
    """
    conn = sqlite3.connect("payments.db")
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()
