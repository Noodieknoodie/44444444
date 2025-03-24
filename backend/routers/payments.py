from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import sqlite3
from datetime import datetime
from main import get_db_dependency

router = APIRouter()

class CreatePaymentModel(BaseModel):
    client_id: int
    contract_id: int
    received_date: str
    total_assets: Optional[float] = None
    actual_fee: float
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

class UpdatePaymentModel(BaseModel):
    received_date: Optional[str] = None
    total_assets: Optional[float] = None
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

@router.post("/")
def create_payment(payment: CreatePaymentModel, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Create a new payment record"""
    cursor = db.cursor()
    
    # First verify the client and contract exist
    cursor.execute(
        "SELECT client_id FROM clients WHERE client_id = ? AND valid_to IS NULL", 
        (payment.client_id,)
    )
    client = cursor.fetchone()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    cursor.execute(
        "SELECT contract_id FROM contracts WHERE contract_id = ? AND is_active = 1", 
        (payment.contract_id,)
    )
    contract = cursor.fetchone()
    if not contract:
        raise HTTPException(status_code=404, detail="Active contract not found")
    
    # Get the payment schedule (monthly or quarterly)
    cursor.execute(
        "SELECT payment_schedule FROM contracts WHERE contract_id = ?", 
        (payment.contract_id,)
    )
    schedule = cursor.fetchone()["payment_schedule"]
    
    # Ensure that period fields match the schedule
    if schedule == "monthly" and (payment.applied_start_month is None or payment.applied_start_month_year is None):
        raise HTTPException(status_code=400, detail="Monthly clients require month period fields")
    
    if schedule == "quarterly" and (payment.applied_start_quarter is None or payment.applied_start_quarter_year is None):
        raise HTTPException(status_code=400, detail="Quarterly clients require quarter period fields")
    
    # Set end period equal to start period if not provided (single-period payment)
    if payment.applied_start_month and not payment.applied_end_month:
        payment.applied_end_month = payment.applied_start_month
        payment.applied_end_month_year = payment.applied_start_month_year
    
    if payment.applied_start_quarter and not payment.applied_end_quarter:
        payment.applied_end_quarter = payment.applied_start_quarter
        payment.applied_end_quarter_year = payment.applied_start_quarter_year
    
    # Insert the payment
    cursor.execute("""
        INSERT INTO payments (
            contract_id, client_id, received_date, total_assets, actual_fee, method, notes,
            applied_start_month, applied_start_month_year, applied_end_month, applied_end_month_year,
            applied_start_quarter, applied_start_quarter_year, applied_end_quarter, applied_end_quarter_year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payment.contract_id, payment.client_id, payment.received_date, payment.total_assets, 
        payment.actual_fee, payment.method, payment.notes,
        payment.applied_start_month, payment.applied_start_month_year, payment.applied_end_month, payment.applied_end_month_year,
        payment.applied_start_quarter, payment.applied_start_quarter_year, payment.applied_end_quarter, payment.applied_end_quarter_year
    ))
    
    payment_id = cursor.lastrowid
    db.commit()
    
    # Get the newly created payment
    cursor.execute("""
        SELECT 
            p.*,
            CASE 
                WHEN p.applied_start_month IS NOT NULL THEN dd1.display_label_monthly
                ELSE dd1.display_label_quarterly
            END AS start_period_label,
            CASE 
                WHEN p.applied_end_month IS NOT NULL THEN dd2.display_label_monthly
                ELSE dd2.display_label_quarterly
            END AS end_period_label
        FROM payments p
        LEFT JOIN date_dimension dd1 ON 
            (p.applied_start_month_year * 100 + p.applied_start_month = dd1.period_key_monthly) OR
            (p.applied_start_quarter_year * 10 + p.applied_start_quarter = dd1.period_key_quarterly AND dd1.month IN (1, 4, 7, 10))
        LEFT JOIN date_dimension dd2 ON 
            (p.applied_end_month_year * 100 + p.applied_end_month = dd2.period_key_monthly) OR
            (p.applied_end_quarter_year * 10 + p.applied_end_quarter = dd2.period_key_quarterly AND dd2.month IN (1, 4, 7, 10))
        WHERE p.payment_id = ?
    """, (payment_id,))
    
    new_payment = dict(cursor.fetchone())
    
    return new_payment

@router.get("/{payment_id}")
def get_payment(payment_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get a specific payment by ID"""
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT 
            p.*,
            c.display_name AS client_name,
            con.payment_schedule,
            CASE 
                WHEN p.applied_start_month IS NOT NULL THEN dd1.display_label_monthly
                ELSE dd1.display_label_quarterly
            END AS start_period_label,
            CASE 
                WHEN p.applied_end_month IS NOT NULL THEN dd2.display_label_monthly
                ELSE dd2.display_label_quarterly
            END AS end_period_label,
            EXISTS(SELECT 1 FROM payment_documents pd WHERE pd.payment_id = p.payment_id) AS has_document
        FROM payments p
        JOIN clients c ON p.client_id = c.client_id
        JOIN contracts con ON p.contract_id = con.contract_id
        LEFT JOIN date_dimension dd1 ON 
            (p.applied_start_month_year * 100 + p.applied_start_month = dd1.period_key_monthly) OR
            (p.applied_start_quarter_year * 10 + p.applied_start_quarter = dd1.period_key_quarterly AND dd1.month IN (1, 4, 7, 10))
        LEFT JOIN date_dimension dd2 ON 
            (p.applied_end_month_year * 100 + p.applied_end_month = dd2.period_key_monthly) OR
            (p.applied_end_quarter_year * 10 + p.applied_end_quarter = dd2.period_key_quarterly AND dd2.month IN (1, 4, 7, 10))
        WHERE p.payment_id = ? AND p.valid_to IS NULL
    """, (payment_id,))
    
    payment = cursor.fetchone()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return dict(payment)

@router.put("/{payment_id}")
def update_payment(payment_id: int, payment: UpdatePaymentModel, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Update an existing payment"""
    cursor = db.cursor()
    
    # Check if payment exists
    cursor.execute("SELECT * FROM payments WHERE payment_id = ? AND valid_to IS NULL", (payment_id,))
    existing_payment = cursor.fetchone()
    
    if not existing_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Build update query dynamically based on provided fields
    update_fields = []
    params = []
    
    for field, value in payment.dict(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = ?")
            params.append(value)
    
    if not update_fields:
        return {"message": "No fields to update"}
    
    # Add payment_id to params
    params.append(payment_id)
    
    # Execute update
    cursor.execute(f"""
        UPDATE payments 
        SET {', '.join(update_fields)} 
        WHERE payment_id = ? AND valid_to IS NULL
    """, params)
    
    db.commit()
    
    # Get updated payment
    cursor.execute("SELECT * FROM payments WHERE payment_id = ?", (payment_id,))
    updated_payment = dict(cursor.fetchone())
    
    return updated_payment

@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Soft delete a payment by setting valid_to"""
    cursor = db.cursor()
    
    # Check if payment exists
    cursor.execute("SELECT * FROM payments WHERE payment_id = ? AND valid_to IS NULL", (payment_id,))
    payment = cursor.fetchone()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Soft delete by setting valid_to
    current_timestamp = datetime.now().isoformat()
    cursor.execute(
        "UPDATE payments SET valid_to = ? WHERE payment_id = ?", 
        (current_timestamp, payment_id)
    )
    
    db.commit()
    
    return {"message": "Payment deleted successfully"}

@router.get("/periods/current")
def get_current_periods(db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get current billing periods"""
    cursor = db.cursor()
    
    cursor.execute("SELECT * FROM v_current_period")
    current_period = dict(cursor.fetchone())
    
    # Get current monthly period
    cursor.execute("SELECT * FROM date_dimension WHERE is_current_monthly = 1")
    current_monthly = dict(cursor.fetchone())
    
    # Get current quarterly period
    cursor.execute("SELECT * FROM date_dimension WHERE is_current_quarterly = 1")
    current_quarterly = dict(cursor.fetchone())
    
    return {
        "current_period_info": current_period,
        "current_monthly_period": {
            "period_key": current_monthly["period_key_monthly"],
            "display_label": current_monthly["display_label_monthly"]
        },
        "current_quarterly_period": {
            "period_key": current_quarterly["period_key_quarterly"],
            "display_label": current_quarterly["display_label_quarterly"]
        }
    }

@router.get("/periods/available/monthly")
def get_available_monthly_periods(
    client_id: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db_dependency)
):
    """Get available monthly periods for data entry"""
    cursor = db.cursor()
    
    # Get periods from date dimension, prioritizing recent periods
    query = """
    SELECT 
        period_key_monthly AS period_key, 
        display_label_monthly AS display_label
    FROM date_dimension
    WHERE month IS NOT NULL
    ORDER BY period_key_monthly DESC
    LIMIT 36
    """
    
    cursor.execute(query)
    periods = [dict(row) for row in cursor.fetchall()]
    
    return periods

@router.get("/periods/available/quarterly")
def get_available_quarterly_periods(
    client_id: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db_dependency)
):
    """Get available quarterly periods for data entry"""
    cursor = db.cursor()
    
    # Get periods from date dimension, prioritizing recent periods
    query = """
    SELECT 
        period_key_quarterly AS period_key, 
        display_label_quarterly AS display_label
    FROM date_dimension
    WHERE month IN (1, 4, 7, 10)  -- First month of each quarter
    ORDER BY period_key_quarterly DESC
    LIMIT 20
    """
    
    cursor.execute(query)
    periods = [dict(row) for row in cursor.fetchall()]
    
    return periods