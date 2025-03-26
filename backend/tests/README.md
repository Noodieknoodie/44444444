# Payment System API Tests

This directory contains tests for the Payment System API using pytest.

## Test Structure

- `conftest.py` - Contains pytest fixtures for database connections and test client
- `test_db.py` - Basic tests for database connectivity and schema
- `test_providers_api.py` - Tests for provider-related endpoints
- `test_clients_api.py` - Tests for client-related endpoints
- `test_contracts_api.py` - Tests for contract-related endpoints
- `test_dates_api.py` - Tests for date dimension related endpoints
- `test_payments_api.py` - Tests for payment-related endpoints

## Testing Approach

1. These tests use SQLite database transactions that are automatically rolled back after each test
2. Most tests follow a common pattern:
   - Set up test data (if needed)
   - Make API request
   - Verify response status code and data structure
   - Verify response content against expected values
   - Clean up any created data

3. Test isolation is maintained by having each test create and clean up its own data
4. Complex operations (like split payments) are tested with specific test cases from the test scenarios

## Running Tests

From the `backend` directory, run:

```bash
pytest -xvs
```

Or run specific test modules:

```bash
pytest -xvs tests/test_payments_api.py
```

## Test Coverage

These tests cover:
- Basic CRUD operations for all resources
- Specific business scenarios like:
  - Creating and managing providers
  - Creating clients and adding contacts/provider relationships
  - Creating contracts with different fee structures
  - Creating normal and split payments
  - Verifying payment periods are correctly tracked
  - Checking payment status by period

## Notes

- Tests are designed against the database state as of March 25, 2025 (the test reference date)
- Some tests may need periodic updates if the database structure changes
- No document-related tests are included at this time
