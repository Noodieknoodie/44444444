
import pytest
from fastapi.testclient import TestClient

def test_get_clients(client):
    """Test retrieving all clients"""
    response = client.get("/api/clients")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure and data
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0
    
    # Check required clients from test scenario
    client_names = [c["display_name"] for c in data["items"]]
    expected_clients = ['AirSea America', 'Bumgardner Architects (ABC)', 'Youth Dynamics']
    for client_name in expected_clients:
        assert client_name in client_names, f"Client '{client_name}' should be in the list"

def test_get_client_by_id(client):
    """Test retrieving a specific client by ID"""
    # Test scenario: Get client ID 2 (Bumgardner Architects)
    response = client.get("/api/clients?client_id=2")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["client_id"] == 2
    assert data["items"][0]["display_name"] == "Bumgardner Architects (ABC)"

def test_create_client(client):
    """Test creating a new client"""
    # Test scenario 3: Create client "New Test Client Ltd"
    client_data = {
        "display_name": "New Test Client Ltd",
        "full_name": "New Test Client Limited Liability",
        "ima_signed_date": "2025-01-15"
    }
    response = client.post("/api/clients", json=client_data)
    assert response.status_code == 200
    
    # Verify the returned data
    created = response.json()
    assert created["display_name"] == "New Test Client Ltd"
    assert created["full_name"] == "New Test Client Limited Liability"
    assert created["ima_signed_date"] == "2025-01-15"
    assert created["client_id"] is not None
    
    # Verify it's in the database now
    client_id = created["client_id"]
    response = client.get(f"/api/clients?client_id={client_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["display_name"] == "New Test Client Ltd"
    
    # Clean up: delete created client
    response = client.delete(f"/api/clients/{client_id}")
    assert response.status_code == 200

def test_update_client(client):
    """Test updating an existing client's details"""
    # Create a client to update
    client_data = {
        "display_name": "New Test Client Ltd",
        "full_name": "New Test Client Limited Liability",
        "ima_signed_date": "2025-01-15"
    }
    response = client.post("/api/clients", json=client_data)
    assert response.status_code == 200
    client_id = response.json()["client_id"]
    
    # Update the client name
    update_data = {"display_name": "Updated Test Client Name"}
    response = client.put(f"/api/clients/{client_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert updated["display_name"] == "Updated Test Client Name"
    
    # Verify the update in the database
    response = client.get(f"/api/clients?client_id={client_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["items"][0]["display_name"] == "Updated Test Client Name"
    
    # Clean up
    response = client.delete(f"/api/clients/{client_id}")
    assert response.status_code == 200

def test_add_provider_relationship(client):
    """Test adding a provider relationship to a client"""
    # Create a test client
    client_data = {
        "display_name": "Provider Relationship Test Client",
        "ima_signed_date": "2025-01-15"
    }
    response = client.post("/api/clients", json=client_data)
    assert response.status_code == 200
    client_id = response.json()["client_id"]
    
    # Add relationship with Fidelity (Provider ID 13)
    provider_relationship = {
        "client_id": client_id,
        "provider_id": 13,
        "start_date": "2025-01-15"
    }
    response = client.post("/api/client-providers", json=provider_relationship)
    assert response.status_code == 200
    
    # Verify the relationship exists
    response = client.get(f"/api/client-providers?client_id={client_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    found = False
    for item in data["items"]:
        if item["provider_id"] == 13:
            found = True
            break
    assert found, "The relationship with Fidelity should exist"
    
    # Clean up relationship
    response = client.delete(f"/api/client-providers/{client_id}/13")
    assert response.status_code == 200
    
    # Clean up client
    response = client.delete(f"/api/clients/{client_id}")
    assert response.status_code == 200

def test_add_contact(client):
    """Test adding a contact to a client"""
    # Create a test client
    client_data = {
        "display_name": "Contact Test Client",
        "ima_signed_date": "2025-01-15"
    }
    response = client.post("/api/clients", json=client_data)
    assert response.status_code == 200
    client_id = response.json()["client_id"]
    
    # Add a primary contact
    contact_data = {
        "client_id": client_id,
        "contact_type": "Primary",
        "contact_name": "Jane Doe",
        "email": "jane.doe@updatedtestclient.com",
        "phone": "555-123-4567"
    }
    response = client.post("/api/contacts", json=contact_data)
    assert response.status_code == 200
    contact_id = response.json()["contact_id"]
    
    # Verify the contact exists
    response = client.get(f"/api/contacts?client_id={client_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert any(c["contact_name"] == "Jane Doe" for c in data["items"])
    
    # Clean up contact
    response = client.delete(f"/api/contacts/{contact_id}")
    assert response.status_code == 200
    
    # Clean up client
    response = client.delete(f"/api/clients/{client_id}")
    assert response.status_code == 200

def test_delete_client(client):
    """Test soft deleting a client (setting valid_to)"""
    # Create a client to delete
    client_data = {"display_name": "Client To Delete"}
    response = client.post("/api/clients", json=client_data)
    assert response.status_code == 200
    client_id = response.json()["client_id"]
    
    # Verify it's in the active clients list
    response = client.get("/api/clients")
    assert response.status_code == 200
    client_ids = [c["client_id"] for c in response.json()["items"]]
    assert client_id in client_ids
    
    # Delete the client
    response = client.delete(f"/api/clients/{client_id}")
    assert response.status_code == 200
    deleted = response.json()
    assert deleted["valid_to"] is not None
    
    # Verify it's no longer in the active clients list
    response = client.get("/api/clients")
    assert response.status_code == 200
    client_ids = [c["client_id"] for c in response.json()["items"]]
    assert client_id not in client_ids

def test_client_payment_views(client, db_connection):
    """Test client payment view endpoints"""
    # Get client with payments - we'll use AirSea America (ID 1)
    
    # Test first payment
    response = client.get("/api/clients/first-payments?client_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    
    # Check first payment details
    first_payment = data["items"][0]
    assert first_payment["client_id"] == 1
    assert first_payment["display_name"] == "AirSea America"
    assert first_payment["first_payment_id"] is not None
    assert first_payment["first_payment_date"] is not None
    assert first_payment["first_payment_amount"] is not None
    
    # Test last payment
    response = client.get("/api/clients/last-payments?client_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    
    # Check last payment details
    last_payment = data["items"][0]
    assert last_payment["client_id"] == 1
    assert last_payment["display_name"] == "AirSea America"
    assert last_payment["last_payment_id"] is not None
    assert last_payment["last_payment_date"] is not None
    assert last_payment["last_payment_amount"] is not None
    assert "days_since_last_payment" in last_payment
