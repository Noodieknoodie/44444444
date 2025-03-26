# app/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

# Import all routers
from api.clients import router as clients_router
from api.contracts import router as contracts_router
from api.payments import router as payments_router
from api.documents import router as documents_router
from api.providers import router as providers_router
from api.dates import router as dates_router

# Create FastAPI app
app = FastAPI(
    title="Payments API",
    description="API for payment management system",
    version="1.0.0",
    docs_url=None,  # Disable default docs
)

# Configure CORS to allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(clients_router)
app.include_router(contracts_router)
app.include_router(payments_router)
app.include_router(documents_router)
app.include_router(providers_router)
app.include_router(dates_router)

# Global exception handler to ensure consistent error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Handle known FastAPI exceptions
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    
    # Log the exception here (not implemented)
    # logger.error(f"Unhandled exception: {str(exc)}")
    
    # Return a generic error for unhandled exceptions
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"},
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """API health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}

# Custom API documentation endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=app.title + " - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css",
    )

@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint():
    return get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

# Reference API endpoints list for frontend developers
@app.get("/api-reference")
async def api_reference():
    """Provides a simplified list of available API endpoints for frontend developers"""
    
    endpoints = {
        "clients": {
            "list": {"method": "GET", "url": "/api/clients", "description": "Get all clients"},
            "create": {"method": "POST", "url": "/api/clients", "description": "Create a new client"},
            "update": {"method": "PUT", "url": "/api/clients/{client_id}", "description": "Update a client"},
            "delete": {"method": "DELETE", "url": "/api/clients/{client_id}", "description": "Delete a client"},
            "firstPayments": {"method": "GET", "url": "/api/clients/first-payments", "description": "Get first payment for each client"},
            "lastPayments": {"method": "GET", "url": "/api/clients/last-payments", "description": "Get last payment for each client"}
        },
        "payments": {
            "list": {"method": "GET", "url": "/api/payments", "description": "Get all payments"},
            "create": {"method": "POST", "url": "/api/payments", "description": "Create a new payment"},
            "update": {"method": "PUT", "url": "/api/payments/{payment_id}", "description": "Update a payment"},
            "delete": {"method": "DELETE", "url": "/api/payments/{payment_id}", "description": "Delete a payment"},
            "distributions": {"method": "GET", "url": "/api/payments/{payment_id}/distributions", "description": "Get distributions for a split payment"},
            "splitPayments": {"method": "GET", "url": "/api/split-payments", "description": "Get all split payment distributions"},
            "currentPeriod": {"method": "GET", "url": "/api/current-period", "description": "Get current billing period info"},
            "paymentStatus": {"method": "GET", "url": "/api/payment-status", "description": "Get payment status for current period"}
        },
        "contracts": {
            "list": {"method": "GET", "url": "/api/contracts", "description": "Get all contracts"},
            "create": {"method": "POST", "url": "/api/contracts", "description": "Create a new contract"},
            "update": {"method": "PUT", "url": "/api/contracts/{contract_id}", "description": "Update a contract"},
            "delete": {"method": "DELETE", "url": "/api/contracts/{contract_id}", "description": "Delete a contract"},
            "activeContracts": {"method": "GET", "url": "/api/active-contracts", "description": "Get active contracts"},
            "expectedPeriods": {"method": "GET", "url": "/api/expected-periods", "description": "Get expected payment periods"},
            "missingPeriods": {"method": "GET", "url": "/api/missing-periods", "description": "Get missing payment periods"}
        },
        "documents": {
            "list": {"method": "GET", "url": "/api/documents", "description": "Get all documents"},
            "create": {"method": "POST", "url": "/api/documents", "description": "Create a new document"},
            "update": {"method": "PUT", "url": "/api/documents/{document_id}", "description": "Update a document"},
            "delete": {"method": "DELETE", "url": "/api/documents/{document_id}", "description": "Delete a document"},
            "linkToClient": {"method": "POST", "url": "/api/document-clients", "description": "Link document to client"},
            "linkToPayment": {"method": "POST", "url": "/api/document-payments", "description": "Link document to payment"}
        },
        "providers": {
            "list": {"method": "GET", "url": "/api/providers", "description": "Get all providers"},
            "create": {"method": "POST", "url": "/api/providers", "description": "Create a new provider"},
            "update": {"method": "PUT", "url": "/api/providers/{provider_id}", "description": "Update a provider"},
            "delete": {"method": "DELETE", "url": "/api/providers/{provider_id}", "description": "Delete a provider"}
        }
    }
    
    return {
        "apiVersion": "1.0.0",
        "endpoints": endpoints,
        "docs": "/docs"
    }

# Frontend integration helper - data structure reference
@app.get("/api/structure-reference")
async def structure_reference():
    """Provides example data structures for frontend integration"""
    
    examples = {
        "payment": {
            "payment_id": 1,
            "client_id": 101,
            "contract_id": 201,
            "received_date": "2023-05-15",
            "total_assets": 500000,
            "actual_fee": 2500.00,
            "method": "Wire Transfer",
            "is_split_payment": 1,
            "period_key_monthly": 202305,
            "start_period_monthly": "May 2023"
        },
        "splitPaymentDistribution": {
            "payment_id": 1,
            "client_id": 101,
            "client_name": "Acme Corporation",
            "received_date": "2023-05-15",
            "total_payment_amount": 5000.00,
            "total_periods_covered": 3,
            "period_key": 202305,
            "period_label": "May 2023",
            "payment_schedule": "monthly",
            "distributed_amount": 1666.67
        },
        "client": {
            "client_id": 101,
            "display_name": "Acme Corporation",
            "full_name": "Acme Corporation LLC",
            "ima_signed_date": "2022-01-15"
        },
        "contract": {
            "contract_id": 201,
            "client_id": 101,
            "contract_number": "ACME-2022-001",
            "provider_id": 301,
            "fee_type": "Percentage",
            "percent_rate": 0.75,
            "flat_rate": null,
            "payment_schedule": "monthly",
            "is_active": 1
        }
    }
    
    return examples