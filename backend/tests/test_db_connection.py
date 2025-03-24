import os
import sys
import unittest
import sqlite3
import threading
from concurrent.futures import ThreadPoolExecutor

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db_utils import get_db
from config.config import Config

class TestDatabaseConnection(unittest.TestCase):
    """Test the database connection for thread safety"""
    
    def test_connection_works(self):
        """Test that we can connect to the database and execute a query"""
        # Get a connection from our get_db function
        conn = get_db()
        cursor = conn.cursor()
        
        # Execute a simple query
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        # Verify the result
        self.assertEqual(result[0], 1)
        
        # Close the connection
        conn.close()
        
    def test_multi_thread_connections(self):
        """Test that we can use connections from multiple threads"""
        
        def thread_function():
            # Get a connection
            conn = get_db()
            cursor = conn.cursor()
            
            # Execute a simple query
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            
            # Verify the result
            self.assertEqual(result[0], 1)
            
            # Close the connection
            conn.close()
            
            return True
        
        # Run the function in multiple threads
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(lambda _: thread_function(), range(5)))
            
        # Verify all threads succeeded
        self.assertTrue(all(results))
        
if __name__ == "__main__":
    unittest.main() 