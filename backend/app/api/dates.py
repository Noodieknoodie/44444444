# app/api/dates.py
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from ..db import get_connection
from ..models.dates import DateDimensionModel, DateDimensionResponse

router = APIRouter(prefix="/api")

@router.get("/date-dimensions", response_model=DateDimensionResponse)
async def get_date_dimensions(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month (1-12)"),
    quarter: Optional[int] = Query(None, description="Filter by quarter (1-4)"),
    is_current_monthly: Optional[int] = Query(None, description="Filter current monthly periods"),
    is_current_quarterly: Optional[int] = Query(None, description="Filter current quarterly periods"),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get date dimension records with filtering options"""
    with get_connection() as conn:
        query = "SELECT * FROM date_dimension"
        conditions = []
        params = []
        
        if year is not None:
            conditions.append("year = ?")
            params.append(year)
            
        if month is not None:
            conditions.append("month = ?")
            params.append(month)
            
        if quarter is not None:
            conditions.append("quarter = ?")
            params.append(quarter)
            
        if is_current_monthly is not None:
            conditions.append("is_current_monthly = ?")
            params.append(is_current_monthly)
            
        if is_current_quarterly is not None:
            conditions.append("is_current_quarterly = ?")
            params.append(is_current_quarterly)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY period_date LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        dates = [DateDimensionModel.model_validate(dict(row)) for row in rows]
        
        return DateDimensionResponse(items=dates, total=total)

@router.get("/date-dimensions/current-month", response_model=DateDimensionModel)
async def get_current_month():
    """Get the current month period from date dimension"""
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM date_dimension WHERE is_current_monthly = 1 LIMIT 1"
        )
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Current month period not found")
        
        return DateDimensionModel.model_validate(dict(row))

@router.get("/date-dimensions/current-quarter", response_model=DateDimensionModel)
async def get_current_quarter():
    """Get the current quarter period from date dimension"""
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM date_dimension WHERE is_current_quarterly = 1 LIMIT 1"
        )
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Current quarter period not found")
        
        return DateDimensionModel.model_validate(dict(row))

@router.get("/date-dimensions/previous-month", response_model=DateDimensionModel)
async def get_previous_month():
    """Get the previous month period from date dimension"""
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM date_dimension WHERE is_previous_month = 1 LIMIT 1"
        )
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Previous month period not found")
        
        return DateDimensionModel.model_validate(dict(row))

@router.get("/date-dimensions/previous-quarter", response_model=DateDimensionModel)
async def get_previous_quarter():
    """Get the previous quarter period from date dimension"""
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM date_dimension WHERE is_previous_quarter = 1 LIMIT 1"
        )
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Previous quarter period not found")
        
        return DateDimensionModel.model_validate(dict(row))