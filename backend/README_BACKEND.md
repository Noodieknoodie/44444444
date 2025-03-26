# Payment Management API
A FastAPI-based backend for payment management system.
## Setup Instructions
### Prerequisites
- Python 3.9+
- SQLite3
### Installation
1. Create a virtual environment:
python -m env venv
source venv/bin/activate  # On Windows: env\Scripts\activate
Install dependencies:
pip install fastapi uvicorn[standard] pydantic
Make sure your SQLite database is placed in the project root as payments.db
Run the application:
python run.py
The API will be available at http://localhost:8000
API Documentation
Once running, access the API documentation at:
http://localhost:8000/docs
Key Endpoints
Payments
GET /api/payments - List all payments
POST /api/payments - Create a new payment
GET /api/payments/{payment_id}/distributions - Get split payment distributions
Clients
GET /api/clients - List all clients
GET /api/clients/last-payments - Get last payment for each client
GET /api/active-contracts - Get active contracts for clients
Reports
GET /api/current-period - Get current billing period info
GET /api/payment-status - Get payment status for current period
GET /api/missing-periods - Get missing payment periods
Frontend Integration
For frontend integration help, see:
http://localhost:8000/api-reference - List of all API endpoints
http://localhost:8000/api/structure-reference - Example data structures
Database Schema
The database uses SQLite with the following main tables:
clients - Client information
contracts - Client contracts
payments - Payment records
providers - Service providers
documents - Document storage and management
And specialized views for reporting:
v_payments - Enhanced payment information
v_split_payment_distribution - Split payment breakdowns
v_client_payment_first/last - Client payment history
v_current_period - Current billing period