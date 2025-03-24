import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

class TestAPIEndpoints(unittest.TestCase):
    """Test the API endpoints"""
    
    def setUp(self):
        self.client = TestClient(app)
    
    def test_health_endpoint(self):
        """Test that the health endpoint returns 200"""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertIn("status", response.json())
        self.assertEqual(response.json()["status"], "healthy")
    
    def test_root_endpoint(self):
        """Test that the root endpoint returns 200"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
    
    def test_clients_endpoint(self):
        """Test that the clients endpoint returns 200"""
        response = self.client.get("/api/clients/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
    
    def test_providers_endpoint(self):
        """Test that the providers endpoint returns 200"""
        response = self.client.get("/api/providers/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
    
    def test_payments_periods_current_endpoint(self):
        """Test that the current periods endpoint returns 200"""
        response = self.client.get("/api/payments/periods/current")
        self.assertEqual(response.status_code, 200)
        
if __name__ == "__main__":
    unittest.main() 