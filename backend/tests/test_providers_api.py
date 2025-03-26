
import pytest
from fastapi.testclient import TestClient

def test_get_providers(client):
    """Test retrieving all providers"""
    response = client.get("/api/providers")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure and data
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] > 0
    
    # Check required providers from test scenario
    provider_names = [p["provider_name"] for p in data["items"]]
    expected_providers = ['Ascensus', 'John Hancock', 'Voya', 'Fidelity', 'Vanguard']
    for provider in expected_providers:
        assert provider in provider_names, f"Provider '{provider}' should be in the list"
    
def test_get_provider_by_id(client):
    """Test retrieving a specific provider by ID"""
    # Test scenario: Get provider ID 8 (John Hancock)
    response = client.get("/api/providers?provider_id=8")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["provider_id"] == 8
    assert data["items"][0]["provider_name"] == "John Hancock"

def test_create_provider(client):
    """Test creating a new provider"""
    # Test scenario: Create provider "Test Provider Inc."
    provider_data = {"provider_name": "Test Provider Inc."}
    response = client.post("/api/providers", json=provider_data)
    assert response.status_code == 200
    
    # Verify the returned data
    created_provider = response.json()
    assert created_provider["provider_name"] == "Test Provider Inc."
    assert created_provider["provider_id"] is not None
    
    # Verify it's in the database now
    provider_id = created_provider["provider_id"]
    response = client.get(f"/api/providers?provider_id={provider_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["provider_name"] == "Test Provider Inc."
    
    # Clean up: delete created provider
    response = client.delete(f"/api/providers/{provider_id}")
    assert response.status_code == 200

def test_update_provider(client):
    """Test updating an existing provider's name"""
    # Create a provider to update
    provider_data = {"provider_name": "Test Provider Inc."}
    response = client.post("/api/providers", json=provider_data)
    assert response.status_code == 200
    provider_id = response.json()["provider_id"]
    
    # Update the provider name
    update_data = {"provider_name": "Test Provider Updated LLC"}
    response = client.put(f"/api/providers/{provider_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert updated["provider_name"] == "Test Provider Updated LLC"
    
    # Verify the update in the database
    response = client.get(f"/api/providers?provider_id={provider_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["items"][0]["provider_name"] == "Test Provider Updated LLC"
    
    # Clean up
    response = client.delete(f"/api/providers/{provider_id}")
    assert response.status_code == 200

def test_delete_provider(client):
    """Test soft deleting a provider (setting valid_to)"""
    # Create a provider to delete
    provider_data = {"provider_name": "Provider To Delete"}
    response = client.post("/api/providers", json=provider_data)
    assert response.status_code == 200
    provider_id = response.json()["provider_id"]
    
    # Verify it's in the active providers list
    response = client.get("/api/providers")
    assert response.status_code == 200
    provider_ids = [p["provider_id"] for p in response.json()["items"]]
    assert provider_id in provider_ids
    
    # Delete the provider
    response = client.delete(f"/api/providers/{provider_id}")
    assert response.status_code == 200
    deleted = response.json()
    assert deleted["valid_to"] is not None
    
    # Verify it's no longer in the active providers list
    response = client.get("/api/providers")
    assert response.status_code == 200
    provider_ids = [p["provider_id"] for p in response.json()["items"]]
    assert provider_id not in provider_ids
    
    # But should still be retrievable directly by ID
    response = client.get(f"/api/providers?provider_id={provider_id}")
    assert response.status_code == 200
    assert response.json()["total"] == 1

def test_delete_nonexistent_provider(client):
    """Test attempt to delete a provider that doesn't exist"""
    # Use a very high ID that shouldn't exist
    response = client.delete("/api/providers/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
