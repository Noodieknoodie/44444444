# app/models/contracts.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Base contract model
class ContractModel(BaseModel):
    """Model for the contracts table"""
    contract_id: Optional[int] = None
    client_id: int
    contract_number: Optional[str] = None
    provider_id: Optional[int] = None
    fee_type: Optional[str] = None
    percent_rate: Optional[float] = None
    flat_rate: Optional[float] = None
    payment_schedule: Optional[str] = None
    num_people: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_active: int = 1
    
    model_config = {"from_attributes": True}

# View models
class ActiveContractViewModel(BaseModel):
    """Model for v_active_contracts view"""
    contract_id: int
    client_id: int
    contract_number: Optional[str] = None
    provider_id: Optional[int] = None
    fee_type: Optional[str] = None
    percent_rate: Optional[float] = None
    flat_rate: Optional[float] = None
    payment_schedule: str
    num_people: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_active: int = 1
    
    model_config = {"from_attributes": True}

class ExpectedPeriodViewModel(BaseModel):
    """Model for v_client_expected_periods view"""
    client_id: int
    payment_schedule: str
    period_key_monthly: Optional[int] = None
    period_key_quarterly: Optional[int] = None
    period_key: int
    period_label: str
    
    model_config = {"from_attributes": True}

class MissingPaymentPeriodViewModel(BaseModel):
    """Model for v_all_missing_payment_periods view"""
    client_id: int
    payment_schedule: str
    period_key: int
    period_label: str
    status: str  # Always "Missing"
    
    model_config = {"from_attributes": True}

# Create/Update models
class ContractCreate(BaseModel):
    client_id: int
    contract_number: Optional[str] = None
    provider_id: Optional[int] = None
    fee_type: Optional[str] = None
    percent_rate: Optional[float] = None
    flat_rate: Optional[float] = None
    payment_schedule: Optional[str] = None
    num_people: Optional[int] = None
    is_active: int = 1

class ContractUpdate(BaseModel):
    contract_number: Optional[str] = None
    provider_id: Optional[int] = None
    fee_type: Optional[str] = None
    percent_rate: Optional[float] = None
    flat_rate: Optional[float] = None
    payment_schedule: Optional[str] = None
    num_people: Optional[int] = None
    is_active: Optional[int] = None

# Response models
class ContractResponse(BaseModel):
    items: List[ContractModel]
    total: int

class ActiveContractResponse(BaseModel):
    items: List[ActiveContractViewModel]
    total: int

class ExpectedPeriodResponse(BaseModel):
    items: List[ExpectedPeriodViewModel]
    total: int

class MissingPaymentPeriodResponse(BaseModel):
    items: List[MissingPaymentPeriodViewModel]
    total: int