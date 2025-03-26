# app/models/dates.py
from pydantic import BaseModel
from typing import Optional, List

# Base date dimension model
class DateDimensionModel(BaseModel):
    """Model for date_dimension table"""
    period_date: str  # YYYY-MM-DD
    year: int
    month: Optional[int] = None
    month_name: Optional[str] = None
    quarter: Optional[int] = None
    period_key_monthly: int  # YYYYMM
    period_key_quarterly: int  # YYYYQ
    display_label_monthly: str
    display_label_quarterly: str
    is_current_monthly: int = 0
    is_current_quarterly: int = 0
    is_previous_month: int = 0
    is_previous_quarter: int = 0
    
    model_config = {"from_attributes": True}

# Response model
class DateDimensionResponse(BaseModel):
    items: List[DateDimensionModel]
    total: int