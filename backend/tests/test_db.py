
import pytest

def test_db_connection(db_connection):
    """Test that the database connection works"""
    cursor = db_connection.execute("PRAGMA table_info(clients)")
    columns = cursor.fetchall()
    assert len(columns) > 0, "Should have columns in the clients table"

def test_db_tables(db_connection):
    """Test that the database has expected tables"""
    cursor = db_connection.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row['name'] for row in cursor.fetchall()]
    
    # Check essential tables exist
    expected_tables = ['clients', 'providers', 'contracts', 'payments', 'date_dimension']
    for table in expected_tables:
        assert table in tables, f"Table {table} should exist in database"

def test_db_views(db_connection):
    """Test that the database has expected views"""
    cursor = db_connection.execute("SELECT name FROM sqlite_master WHERE type='view'")
    views = [row['name'] for row in cursor.fetchall()]
    
    # Print all views for debugging
    print("Available views:", views)
    
    # Check essential views exist
    expected_views = [
        'v_active_contracts',
        'v_client_payment_first',
        'v_client_payment_last', 
        'v_client_expected_periods', 
        'v_all_missing_payment_periods'
    ]
    for view in expected_views:
        assert view in views, f"View {view} should exist in database"

def test_clients_data(db_connection):
    """Test that some sample client data exists"""
    cursor = db_connection.execute("SELECT COUNT(*) as count FROM clients")
    count = cursor.fetchone()['count']
    assert count > 0, "Database should have client records"
    
    # Check specific client exists
    cursor = db_connection.execute("SELECT * FROM clients WHERE client_id = 1")
    client = cursor.fetchone()
    assert client is not None, "Client with ID 1 should exist"
    assert client['display_name'] == 'AirSea America', "Client 1 should be AirSea America"
