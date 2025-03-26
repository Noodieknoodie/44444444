# app/models/documents.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Base document model
class DocumentModel(BaseModel):
    """Model for documents table"""
    document_id: Optional[int] = None
    provider_id: int
    document_type: str
    received_date: str
    file_name: str
    file_path: str
    metadata: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# Junction table models
class DocumentClientModel(BaseModel):
    """Model for document_clients junction table"""
    id: Optional[int] = None
    document_id: int
    client_id: int
    
    model_config = {"from_attributes": True}

class DocumentPaymentModel(BaseModel):
    """Model for document_payments junction table"""
    id: Optional[int] = None
    payment_id: int
    document_id: int
    
    model_config = {"from_attributes": True}

# Create/Update models
class DocumentCreate(BaseModel):
    provider_id: int
    document_type: str
    received_date: str
    file_name: str
    file_path: str
    metadata: Optional[str] = None

class DocumentUpdate(BaseModel):
    provider_id: Optional[int] = None
    document_type: Optional[str] = None
    received_date: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    metadata: Optional[str] = None

class DocumentClientCreate(BaseModel):
    document_id: int
    client_id: int

class DocumentPaymentCreate(BaseModel):
    payment_id: int
    document_id: int

# Response models
class DocumentResponse(BaseModel):
    items: List[DocumentModel]
    total: int

class DocumentClientResponse(BaseModel):
    items: List[DocumentClientModel]
    total: int

class DocumentPaymentResponse(BaseModel):
    items: List[DocumentPaymentModel]
    total: int