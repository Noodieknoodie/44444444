# app/models/clients.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Base table models
class ClientModel(BaseModel):
    """Model for the clients table"""
    client_id: Optional[int] = None
    display_name: str
    full_name: Optional[str] = None
    ima_signed_date: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class ClientFolderModel(BaseModel):
    """Model for the client_folders table"""
    client_id: int
    actual_folder_name: str
    
    model_config = {"from_attributes": True}

class ClientProviderModel(BaseModel):
    """Model for the client_providers table"""
    client_id: int
    provider_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: int = 1
    
    model_config = {"from_attributes": True}

class ContactModel(BaseModel):
    """Model for the contacts table"""
    contact_id: Optional[int] = None
    client_id: int
    contact_type: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None
    physical_address: Optional[str] = None
    mailing_address: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# View models
class ClientFirstPaymentViewModel(BaseModel):
    """Model for the v_client_payment_first view"""
    client_id: int
    display_name: str
    first_payment_id: int
    first_payment_date: date
    first_payment_amount: float
    first_payment_method: Optional[str] = None
    first_payment_assets: Optional[float] = None
    first_payment_period_key: Optional[int] = None
    first_payment_period: Optional[str] = None
    
    model_config = {"from_attributes": True}

class ClientLastPaymentViewModel(BaseModel):
    """Model for the v_client_payment_last view"""
    client_id: int
    display_name: str
    last_payment_id: int
    last_payment_date: date
    last_payment_amount: float
    last_payment_method: Optional[str] = None
    last_payment_assets: Optional[float] = None
    last_payment_period_key: Optional[int] = None
    last_payment_period: Optional[str] = None
    days_since_last_payment: float
    
    model_config = {"from_attributes": True}

# Create/Update models
class ClientCreate(BaseModel):
    display_name: str
    full_name: Optional[str] = None
    ima_signed_date: Optional[str] = None

class ClientUpdate(BaseModel):
    display_name: Optional[str] = None
    full_name: Optional[str] = None
    ima_signed_date: Optional[str] = None

class ClientFolderCreate(BaseModel):
    client_id: int
    actual_folder_name: str

class ClientFolderUpdate(BaseModel):
    actual_folder_name: str

class ClientProviderCreate(BaseModel):
    client_id: int
    provider_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[int] = 1

class ClientProviderUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[int] = None

class ContactCreate(BaseModel):
    client_id: int
    contact_type: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None
    physical_address: Optional[str] = None
    mailing_address: Optional[str] = None

class ContactUpdate(BaseModel):
    contact_type: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None
    physical_address: Optional[str] = None
    mailing_address: Optional[str] = None

# Response models
class ClientResponse(BaseModel):
    items: List[ClientModel]
    total: int

class ClientFolderResponse(BaseModel):
    items: List[ClientFolderModel]
    total: int

class ClientProviderResponse(BaseModel):
    items: List[ClientProviderModel]
    total: int

class ContactResponse(BaseModel):
    items: List[ContactModel] 
    total: int

class ClientFirstPaymentResponse(BaseModel):
    items: List[ClientFirstPaymentViewModel]
    total: int
    
class ClientLastPaymentResponse(BaseModel):
    items: List[ClientLastPaymentViewModel]
    total: int