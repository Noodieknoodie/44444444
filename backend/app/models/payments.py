# app/models/payments.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Base table model
class PaymentModel(BaseModel):
    """Model for raw payments table"""
    payment_id: Optional[int] = None
    contract_id: int
    client_id: int
    received_date: Optional[str] = None
    total_assets: Optional[int] = None
    actual_fee: Optional[float] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    applied_start_month: Optional[int] = None
    applied_start_month_year: Optional[int] = None
    applied_end_month: Optional[int] = None
    applied_end_month_year: Optional[int] = None
    applied_start_quarter: Optional[int] = None
    applied_start_quarter_year: Optional[int] = None
    applied_end_quarter: Optional[int] = None
    applied_end_quarter_year: Optional[int] = None
    
    model_config = {"from_attributes": True}

# View models
class PaymentViewModel(BaseModel):
    """Model for v_payments view"""
    payment_id: int
    contract_id: int
    client_id: int
    received_date: date
    total_assets: Optional[int] = None
    actual_fee: float
    method: Optional[str] = None
    notes: Optional[str] = None
    start_period_monthly: Optional[str] = None
    start_period_quarterly: Optional[str] = None
    period_key_monthly: Optional[int] = None
    period_key_quarterly: Optional[int] = None
    is_split_payment: int
    
    # Extra fields from joins
    display_name: Optional[str] = None
    
    model_config = {"from_attributes": True}

class SplitPaymentDistributionViewModel(BaseModel):
    """Model for v_split_payment_distribution view"""
    payment_id: int
    client_id: int
    client_name: str
    received_date: date
    total_payment_amount: float
    is_split_payment: int = 1
    total_periods_covered: int
    period_key: int
    period_label: str
    payment_schedule: str
    distributed_amount: float
    
    model_config = {"from_attributes": True}

class ExpandedPaymentPeriodViewModel(BaseModel):
    """Model for v_expanded_payment_periods view"""
    payment_id: int
    client_id: int
    period_key: int
    payment_schedule: str
    
    model_config = {"from_attributes": True}

class PaymentPeriodCoverageViewModel(BaseModel):
    """Model for v_payment_period_coverage view"""
    payment_id: int
    client_id: int
    received_date: date
    actual_fee: float
    is_split_payment: int
    covered_monthly_periods: Optional[str] = None
    covered_quarterly_periods: Optional[str] = None
    periods_covered: int
    distributed_amount_per_period: float
    
    model_config = {"from_attributes": True}

class CurrentPeriodViewModel(BaseModel):
    """Model for v_current_period view"""
    today: date
    current_year: int
    current_month: int
    current_month_for_billing: int
    current_month_year_for_billing: int
    current_quarter_for_billing: int
    current_quarter_year_for_billing: int
    current_monthly_key: int
    current_quarterly_key: int
    
    model_config = {"from_attributes": True}

class PaymentStatusViewModel(BaseModel):
    """Model for v_current_period_payment_status view"""
    client_id: int
    payment_schedule: str
    period_key: int
    period_label: str
    status: str
    
    model_config = {"from_attributes": True}

# Create/Update models
class PaymentCreate(BaseModel):
    contract_id: int
    client_id: int
    received_date: Optional[str] = None
    total_assets: Optional[int] = None
    actual_fee: Optional[float] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    applied_start_month: Optional[int] = None
    applied_start_month_year: Optional[int] = None
    applied_end_month: Optional[int] = None
    applied_end_month_year: Optional[int] = None
    applied_start_quarter: Optional[int] = None
    applied_start_quarter_year: Optional[int] = None
    applied_end_quarter: Optional[int] = None
    applied_end_quarter_year: Optional[int] = None

class PaymentUpdate(BaseModel):
    contract_id: Optional[int] = None
    received_date: Optional[str] = None
    total_assets: Optional[int] = None
    actual_fee: Optional[float] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    applied_start_month: Optional[int] = None
    applied_start_month_year: Optional[int] = None
    applied_end_month: Optional[int] = None
    applied_end_month_year: Optional[int] = None
    applied_start_quarter: Optional[int] = None
    applied_start_quarter_year: Optional[int] = None
    applied_end_quarter: Optional[int] = None
    applied_end_quarter_year: Optional[int] = None

# Response models
class PaymentResponse(BaseModel):
    items: List[PaymentModel]
    total: int

class PaymentViewResponse(BaseModel):
    items: List[PaymentViewModel]
    total: int

class SplitPaymentDistributionResponse(BaseModel):
    items: List[SplitPaymentDistributionViewModel]
    total: int

class ExpandedPaymentPeriodResponse(BaseModel):
    items: List[ExpandedPaymentPeriodViewModel]
    total: int

class PaymentPeriodCoverageResponse(BaseModel):
    items: List[PaymentPeriodCoverageViewModel]
    total: int

class PaymentStatusResponse(BaseModel):
    items: List[PaymentStatusViewModel]
    total: int