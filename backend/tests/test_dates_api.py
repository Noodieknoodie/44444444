
import pytest
from fastapi.testclient import TestClient

def test_get_dates(client):
    """Test retrieving all date dimension entries"""
    response = client.get("/api/date-dimensions")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0
    
    # Check a date record has expected structure
    if len(data["items"]) > 0:
        date = data["items"][0]
        required_fields = [
            "period_date", "year", "month", "quarter", 
            "period_key_monthly", "period_key_quarterly"
        ]
        for field in required_fields:
            assert field in date, f"Date record should include {field}"

def test_get_current_monthly_period(client, db_connection):
    """Test retrieving the current monthly period entry"""
    # Query the database directly to find the current monthly period
    cursor = db_connection.execute(
        "SELECT * FROM date_dimension WHERE is_current_monthly = 1"
    )
    row = cursor.fetchone()
    
    if not row:
        pytest.skip("No current monthly period found in database")
    
    # Now try the API
    response = client.get("/api/date-dimensions/current-month")
    assert response.status_code == 200
    data = response.json()
    
    # Now check if fields match what we expect
    assert data["period_key_monthly"] == row["period_key_monthly"]
    assert data["display_label_monthly"] == row["display_label_monthly"]
    assert data["is_current_monthly"] == 1

def test_get_current_quarterly_period(client, db_connection):
    """Test retrieving the current quarterly period entry"""
    # Query the database directly to find the current quarterly period
    cursor = db_connection.execute(
        "SELECT * FROM date_dimension WHERE is_current_quarterly = 1"
    )
    row = cursor.fetchone()
    
    if not row:
        pytest.skip("No current quarterly period found in database")
    
    # Now try the API
    response = client.get("/api/date-dimensions/current-quarter")
    assert response.status_code == 200
    data = response.json()
    
    # Now check if fields match what we expect
    assert data["period_key_quarterly"] == row["period_key_quarterly"]
    assert data["display_label_quarterly"] == row["display_label_quarterly"]
    assert data["is_current_quarterly"] == 1

# Skip tests for previous periods since they don't exist in the database
def test_get_previous_monthly_period(client, db_connection):
    """Test retrieving the previous monthly period entry"""
    # Update the database to set the previous month flag
    cursor = db_connection.execute(
        "UPDATE date_dimension SET is_previous_month = 1 WHERE period_date = '2025-01-01'"
    )
    db_connection.commit()
    
    # Verify the update worked
    cursor = db_connection.execute(
        "SELECT * FROM date_dimension WHERE is_previous_month = 1"
    )
    row = cursor.fetchone()
    assert row is not None, "Failed to set previous month flag"
    
    # Now check the API response
    response = client.get("/api/date-dimensions/previous-month")
    assert response.status_code == 200
    data = response.json()
    
    # Check that we got the right period
    assert data["period_key_monthly"] == 202501
    assert data["display_label_monthly"] == "Jan 2025"
    assert data["is_previous_month"] == 1

def test_get_previous_quarterly_period(client, db_connection):
    """Test retrieving the previous quarterly period entry"""
    # Update the database to set the previous quarter flag
    cursor = db_connection.execute(
        "UPDATE date_dimension SET is_previous_quarter = 1 WHERE period_date = '2024-09-01'"
    )
    db_connection.commit()
    
    # Verify the update worked
    cursor = db_connection.execute(
        "SELECT * FROM date_dimension WHERE is_previous_quarter = 1"
    )
    row = cursor.fetchone()
    assert row is not None, "Failed to set previous quarter flag"
    
    # Now check the API response
    response = client.get("/api/date-dimensions/previous-quarter")
    assert response.status_code == 200
    data = response.json()
    
    # Check that we got the right period
    assert data["period_key_quarterly"] == 20243
    assert data["display_label_quarterly"] == "Q3 2024"
    assert data["is_previous_quarter"] == 1
