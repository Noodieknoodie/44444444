import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import sqlite3
import os
from datetime import datetime
from pathlib import Path
import json

# Import services
from services.document_service import DocumentService
from config.config import Config

# Import database utils
from database.db_utils import get_db

# Create a dependency that yields a connection for FastAPI
def get_db_dependency():
    """
    Create a database dependency for FastAPI endpoints
    """
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()

# Import routers
from routers.clients import router as clients_router
from routers.payments import router as payments_router
from routers.providers import router as providers_router
from routers.documents import router as documents_router

app = FastAPI(title="401k Payment Management")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=False,  # Change to False to avoid preflight credentials issues
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include routers
app.include_router(clients_router, prefix="/api/clients", tags=["clients"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
app.include_router(providers_router, prefix="/api/providers", tags=["providers"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])

# Health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "environment": "development" if Config.is_development() else "production",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Root endpoint redirects to docs
@app.get("/")
def root():
    return {"message": "401k Payment Management API. See /docs for documentation."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)