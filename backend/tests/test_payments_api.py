
import pytest
from fastapi.testclient import TestClient

def test_get_payments(client):
    """Test retrieving payments"""
    response = client.get("/api/payments")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0

def test_get_payments_for_client(client):
    """Test retrieving raw payment table data for a specific client"""
    # Get payments for AirSea America (client_id = 1)
    response = client.get("/api/payments-table?client_id=1")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    
    # If we have payments, check they're for the right client
    if data["total"] > 0:
        assert all(p["client_id"] == 1 for p in data["items"])

def test_create_simple_payment(client):
    """Test creating a simple payment"""
    # Find an existing client and contract
    response = client.get("/api/clients")
    assert response.status_code == 200
    clients = response.json()["items"]
    
    if len(clients) == 0:
        pytest.skip("No clients found - skipping test")
    
    client_id = clients[0]["client_id"]
    
    # Get contracts for this client
    response = client.get(f"/api/contracts?client_id={client_id}")
    assert response.status_code == 200
    contracts = response.json()["items"]
    
    if len(contracts) == 0:
        pytest.skip("No contracts found for client - skipping test")
    
    contract_id = contracts[0]["contract_id"]
    
    # Create a minimal payment
    payment_data = {
        "client_id": client_id,
        "contract_id": contract_id,
        "received_date": "2025-03-25",
        "actual_fee": 100.00,
        "method": "Test"
    }
    
    response = client.post("/api/payments", json=payment_data)
    assert response.status_code == 200
    created = response.json()
    
    # Verify basic data
    assert created["client_id"] == client_id
    assert created["contract_id"] == contract_id
    assert created["actual_fee"] == 100.00
    assert created["method"] == "Test"
    
    # Clean up
    payment_id = created["payment_id"]
    response = client.delete(f"/api/payments/{payment_id}")
    assert response.status_code == 200

def test_payment_status_view(client):
    """Test payment status view"""
    # Get the current payment status for all clients
    response = client.get("/api/payment-status")
    assert response.status_code == 200
    data = response.json()
    
    assert "items" in data
    assert "total" in data
    
    # Skip detailed checks if no data
    if data["total"] == 0:
        pytest.skip("No payment status data found")
    
    # Each status item should have basic fields
    required_fields = ["client_id", "status"]
    for status in data["items"]:
        for field in required_fields:
            assert field in status, f"Status should include {field}"

def test_current_period(client):
    """Test current period view"""
    response = client.get("/api/current-period")
    assert response.status_code == 200
    data = response.json()
    
    # Check for required fields
    assert "current_year" in data
    assert "current_month" in data
    assert "current_monthly_key" in data
    assert "current_quarterly_key" in data
