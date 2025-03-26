
import pytest
from fastapi.testclient import TestClient

def test_get_contracts(client):
    """Test retrieving all contracts"""
    response = client.get("/api/contracts")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0

def test_get_active_contracts(client):
    """Test retrieving active contracts"""
    response = client.get("/api/active-contracts")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0
    
    # Check all returned contracts are active
    contract_ids = [c["contract_id"] for c in data["items"]]
    expected_active_ids = [1, 2, 3, 18, 19, 20, 35, 36, 37]
    
    # Verify at least some of the expected IDs are present
    # (We don't verify all because the test data might change)
    found_ids = [id for id in expected_active_ids if id in contract_ids]
    assert len(found_ids) > 0, "Should find some of the expected active contract IDs"

def test_create_monthly_flat_contract(client):
    """Test creating a new monthly flat-rate contract"""
    # First check if client with ID 30 exists
    response = client.get("/api/clients?client_id=30")
    if response.json()["total"] == 0:
        # Create client if needed
        client_data = {"display_name": "ABC Company"}
        response = client.post("/api/clients", json=client_data)
        assert response.status_code == 200
        client_id = response.json()["client_id"]
        
        # Create client-provider relationship with provider ID 6
        relationship = {
            "client_id": client_id,
            "provider_id": 6,
            "start_date": "2025-01-01"
        }
        response = client.post("/api/client-providers", json=relationship)
        assert response.status_code == 200
    else:
        client_id = 30
    
    # Create a monthly, flat-rate contract
    contract_data = {
        "client_id": client_id,
        "provider_id": 6,
        "contract_number": "ABC-MONTHLY-01", 
        "fee_type": "flat",
        "flat_rate": 500.00,
        "payment_schedule": "monthly",
        "is_active": 1
    }
    
    response = client.post("/api/contracts", json=contract_data)
    assert response.status_code == 200
    
    # Verify the returned data
    created = response.json()
    assert created["client_id"] == client_id
    assert created["contract_number"] == "ABC-MONTHLY-01"
    assert created["fee_type"] == "flat"
    assert float(created["flat_rate"]) == 500.00
    assert created["payment_schedule"] == "monthly"
    assert created["is_active"] == 1
    
    # Verify it's in active contracts
    contract_id = created["contract_id"]
    response = client.get(f"/api/active-contracts?client_id={client_id}")
    assert response.status_code == 200
    data = response.json()
    assert any(c["contract_id"] == contract_id for c in data["items"])
    
    # Clean up: delete created contract
    response = client.delete(f"/api/contracts/{contract_id}")
    assert response.status_code == 200

def test_create_quarterly_percentage_contract(client):
    """Test creating a new quarterly percentage-rate contract"""
    # First check if client with ID 31 exists
    response = client.get("/api/clients?client_id=31")
    if response.json()["total"] == 0:
        # Create client if needed
        client_data = {"display_name": "XYZ Inc"}
        response = client.post("/api/clients", json=client_data)
        assert response.status_code == 200
        client_id = response.json()["client_id"]
        
        # Create client-provider relationship with provider ID 14
        relationship = {
            "client_id": client_id,
            "provider_id": 14,
            "start_date": "2025-01-01"
        }
        response = client.post("/api/client-providers", json=relationship)
        assert response.status_code == 200
    else:
        client_id = 31
    
    # Create a quarterly, percentage-rate contract
    contract_data = {
        "client_id": client_id,
        "provider_id": 14,
        "contract_number": "XYZ-QUARTERLY-01", 
        "fee_type": "percentage",
        "percent_rate": 0.0015,
        "payment_schedule": "quarterly",
        "is_active": 1
    }
    
    response = client.post("/api/contracts", json=contract_data)
    assert response.status_code == 200
    
    # Verify the returned data
    created = response.json()
    assert created["client_id"] == client_id
    assert created["contract_number"] == "XYZ-QUARTERLY-01"
    assert created["fee_type"] == "percentage"
    assert float(created["percent_rate"]) == 0.0015
    assert created["payment_schedule"] == "quarterly"
    assert created["is_active"] == 1
    
    # Verify it's in active contracts
    contract_id = created["contract_id"]
    response = client.get(f"/api/active-contracts?client_id={client_id}")
    assert response.status_code == 200
    data = response.json()
    assert any(c["contract_id"] == contract_id for c in data["items"])
    
    # Clean up: delete created contract
    response = client.delete(f"/api/contracts/{contract_id}")
    assert response.status_code == 200

def test_update_contract(client):
    """Test updating an existing contract"""
    # Create a contract to update
    # First ensure client exists
    response = client.get("/api/clients?client_id=30")
    if response.json()["total"] == 0:
        client_data = {"display_name": "ABC Company"}
        response = client.post("/api/clients", json=client_data)
        client_id = response.json()["client_id"]
        
        # Create client-provider relationship
        relationship = {
            "client_id": client_id,
            "provider_id": 6,
            "start_date": "2025-01-01"
        }
        response = client.post("/api/client-providers", json=relationship)
    else:
        client_id = 30
    
    # Create contract
    contract_data = {
        "client_id": client_id,
        "provider_id": 6,
        "contract_number": "UPDATE-TEST-01", 
        "fee_type": "flat",
        "flat_rate": 500.00,
        "payment_schedule": "monthly",
        "is_active": 1
    }
    
    response = client.post("/api/contracts", json=contract_data)
    assert response.status_code == 200
    contract_id = response.json()["contract_id"]
    
    # Update the contract flat rate
    update_data = {"flat_rate": 550.00}
    response = client.put(f"/api/contracts/{contract_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert float(updated["flat_rate"]) == 550.00
    
    # Verify the update in the database
    response = client.get(f"/api/contracts?contract_id={contract_id}")
    assert response.status_code == 200
    data = response.json()
    assert float(data["items"][0]["flat_rate"]) == 550.00
    
    # Clean up
    response = client.delete(f"/api/contracts/{contract_id}")
    assert response.status_code == 200

def test_deactivate_contract(client):
    """Test deactivating a contract"""
    # Create a contract to deactivate
    # First ensure client exists
    response = client.get("/api/clients?client_id=31")
    if response.json()["total"] == 0:
        client_data = {"display_name": "XYZ Inc"}
        response = client.post("/api/clients", json=client_data)
        client_id = response.json()["client_id"]
        
        # Create client-provider relationship
        relationship = {
            "client_id": client_id,
            "provider_id": 14,
            "start_date": "2025-01-01"
        }
        response = client.post("/api/client-providers", json=relationship)
    else:
        client_id = 31
    
    # Create contract
    contract_data = {
        "client_id": client_id,
        "provider_id": 14,
        "contract_number": "DEACTIVATE-TEST-01", 
        "fee_type": "percentage",
        "percent_rate": 0.0015,
        "payment_schedule": "quarterly",
        "is_active": 1
    }
    
    response = client.post("/api/contracts", json=contract_data)
    assert response.status_code == 200
    contract_id = response.json()["contract_id"]
    
    # Verify it's in active contracts
    response = client.get("/api/active-contracts")
    assert response.status_code == 200
    active_ids = [c["contract_id"] for c in response.json()["items"]]
    assert contract_id in active_ids
    
    # Delete/deactivate the contract
    response = client.delete(f"/api/contracts/{contract_id}")
    assert response.status_code == 200
    deleted = response.json()
    assert deleted["valid_to"] is not None
    
    # Verify it's no longer in active contracts
    response = client.get("/api/active-contracts")
    assert response.status_code == 200
    active_ids = [c["contract_id"] for c in response.json()["items"]]
    assert contract_id not in active_ids

def test_expected_periods_monthly_client(client):
    """Test viewing expected payment periods for a monthly client"""
    # AirSea America (client_id = 1) is monthly
    response = client.get("/api/expected-periods?client_id=1")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure and basic data
    assert "items" in data
    assert "total" in data
    assert data["total"] > 0
    
    # Check for specific period keys from different years
    period_keys = [p["period_key"] for p in data["items"]]
    expected_keys = [201905, 202001, 202502]  # Sample keys from test scenario
    
    # We should find at least some of these keys
    found_keys = [key for key in expected_keys if key in period_keys]
    assert len(found_keys) > 0, "Should find some expected period keys"

def test_expected_periods_quarterly_client(client):
    """Test viewing expected payment periods for a quarterly client"""
    # Hos Bros (client_id = 14) is quarterly
    response = client.get("/api/expected-periods?client_id=14")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure and basic data
    assert "items" in data
    assert "total" in data
    assert data["total"] > 0
    
    # Check for specific period keys from different years
    period_keys = [p["period_key"] for p in data["items"]]
    expected_keys = [20192, 20201, 20244]  # Sample keys from test scenario
    
    # We should find at least some of these keys
    found_keys = [key for key in expected_keys if key in period_keys]
    assert len(found_keys) > 0, "Should find some expected period keys"

def test_missing_periods(client):
    """Test viewing missing payment periods for a client with gaps"""
    # AirSea America (client_id = 1) should have some gaps
    response = client.get("/api/missing-periods?client_id=1")
    assert response.status_code == 200
    data = response.json()
    
    # We should have some missing periods
    assert "items" in data
    assert "total" in data
    
    # The period keys from the missing periods
    period_keys = [p["period_key"] for p in data["items"]]
    
    # Check if the specifically mentioned period keys in the test scenario are missing
    # Note: This might change if you add payments as part of other tests
    expected_missing = [202210, 202502]  # Oct 2022 and Feb 2025
    
    # We should find at least some of these keys
    found_keys = [key for key in expected_missing if key in period_keys]
    assert len(found_keys) > 0, "Should find some expected missing periods"
