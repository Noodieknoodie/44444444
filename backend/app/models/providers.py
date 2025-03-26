# app/models/providers.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Base provider model
class ProviderModel(BaseModel):
    """Model for providers table"""
    provider_id: Optional[int] = None
    provider_name: str
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# Create/Update models
class ProviderCreate(BaseModel):
    provider_name: str

class ProviderUpdate(BaseModel):
    provider_name: Optional[str] = None

# Response model
class ProviderResponse(BaseModel):
    items: List[ProviderModel]
    total: int