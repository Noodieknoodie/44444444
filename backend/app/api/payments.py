# app/api/payments.py
from fastapi import APIRouter, Query, HTTPException, Body, Path
from typing import Optional
from datetime import datetime

from ..db import get_connection
from ..models.payments import (
    PaymentModel, PaymentCreate, PaymentUpdate, PaymentResponse,
    PaymentViewModel, PaymentViewResponse,
    SplitPaymentDistributionViewModel, SplitPaymentDistributionResponse,
    ExpandedPaymentPeriodViewModel, ExpandedPaymentPeriodResponse,
    PaymentPeriodCoverageViewModel, PaymentPeriodCoverageResponse,
    CurrentPeriodViewModel, PaymentStatusViewModel, PaymentStatusResponse
)

router = APIRouter(prefix="/api")

# ----- PAYMENT BASE TABLE -----
@router.get("/payments-table", response_model=PaymentResponse)
async def get_payments_table(
    payment_id: Optional[int] = Query(None),
    contract_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    method: Optional[str] = Query(None),
    min_date: Optional[str] = Query(None, description="Minimum received date (YYYY-MM-DD)"),
    max_date: Optional[str] = Query(None, description="Maximum received date (YYYY-MM-DD)"),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get raw payments data from the payments table
    """
    with get_connection() as conn:
        query = "SELECT * FROM payments WHERE valid_to IS NULL"
        params = []
        
        if payment_id is not None:
            query += " AND payment_id = ?"
            params.append(payment_id)
            
        if contract_id is not None:
            query += " AND contract_id = ?"
            params.append(contract_id)
            
        if client_id is not None:
            query += " AND client_id = ?"
            params.append(client_id)
            
        if method is not None:
            query += " AND method = ?"
            params.append(method)
            
        if min_date is not None:
            query += " AND received_date >= ?"
            params.append(min_date)
            
        if max_date is not None:
            query += " AND received_date <= ?"
            params.append(max_date)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination and sorting
        query += " ORDER BY received_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        payments = [PaymentModel.model_validate(dict(row)) for row in rows]
        
        return PaymentResponse(items=payments, total=total)

@router.post("/payments", response_model=PaymentModel)
async def create_payment(payment: PaymentCreate):
    """Create a new payment"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO payments (
                    contract_id, client_id, received_date, total_assets, actual_fee,
                    method, notes, applied_start_month, applied_start_month_year,
                    applied_end_month, applied_end_month_year, applied_start_quarter,
                    applied_start_quarter_year, applied_end_quarter, applied_end_quarter_year
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payment.contract_id, payment.client_id, payment.received_date,
                    payment.total_assets, payment.actual_fee, payment.method,
                    payment.notes, payment.applied_start_month, payment.applied_start_month_year,
                    payment.applied_end_month, payment.applied_end_month_year,
                    payment.applied_start_quarter, payment.applied_start_quarter_year,
                    payment.applied_end_quarter, payment.applied_end_quarter_year
                )
            )
            conn.commit()
            
            # Get the created payment
            payment_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM payments WHERE payment_id = ?", (payment_id,))
            row = cursor.fetchone()
            
            return PaymentModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Client or contract not found")
            raise

@router.put("/payments/{payment_id}", response_model=PaymentModel)
async def update_payment(
    payment_id: int = Path(...),
    payment: PaymentUpdate = Body(...)
):
    """Update a payment"""
    with get_connection() as conn:
        # Check if payment exists
        cursor = conn.execute(
            "SELECT * FROM payments WHERE payment_id = ? AND valid_to IS NULL",
            (payment_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Build update query dynamically based on provided fields
        updates = []
        params = []
        
        if payment.contract_id is not None:
            updates.append("contract_id = ?")
            params.append(payment.contract_id)
            
        if payment.received_date is not None:
            updates.append("received_date = ?")
            params.append(payment.received_date)
            
        if payment.total_assets is not None:
            updates.append("total_assets = ?")
            params.append(payment.total_assets)
            
        if payment.actual_fee is not None:
            updates.append("actual_fee = ?")
            params.append(payment.actual_fee)
            
        if payment.method is not None:
            updates.append("method = ?")
            params.append(payment.method)
            
        if payment.notes is not None:
            updates.append("notes = ?")
            params.append(payment.notes)
            
        if payment.applied_start_month is not None:
            updates.append("applied_start_month = ?")
            params.append(payment.applied_start_month)
            
        if payment.applied_start_month_year is not None:
            updates.append("applied_start_month_year = ?")
            params.append(payment.applied_start_month_year)
            
        if payment.applied_end_month is not None:
            updates.append("applied_end_month = ?")
            params.append(payment.applied_end_month)
            
        if payment.applied_end_month_year is not None:
            updates.append("applied_end_month_year = ?")
            params.append(payment.applied_end_month_year)
            
        if payment.applied_start_quarter is not None:
            updates.append("applied_start_quarter = ?")
            params.append(payment.applied_start_quarter)
            
        if payment.applied_start_quarter_year is not None:
            updates.append("applied_start_quarter_year = ?")
            params.append(payment.applied_start_quarter_year)
            
        if payment.applied_end_quarter is not None:
            updates.append("applied_end_quarter = ?")
            params.append(payment.applied_end_quarter)
            
        if payment.applied_end_quarter_year is not None:
            updates.append("applied_end_quarter_year = ?")
            params.append(payment.applied_end_quarter_year)
            
        if not updates:
            # No updates provided
            return PaymentModel.model_validate(dict(existing))
            
        update_str = ", ".join(updates)
        params.append(payment_id)
        
        # Update payment
        cursor = conn.execute(
            f"UPDATE payments SET {update_str} WHERE payment_id = ?",
            params
        )
        conn.commit()
        
        # Get updated payment
        cursor = conn.execute("SELECT * FROM payments WHERE payment_id = ?", (payment_id,))
        row = cursor.fetchone()
        
        return PaymentModel.model_validate(dict(row))

@router.delete("/payments/{payment_id}", response_model=PaymentModel)
async def delete_payment(payment_id: int = Path(...)):
    """Soft delete a payment by setting valid_to"""
    with get_connection() as conn:
        # Check if payment exists
        cursor = conn.execute(
            "SELECT * FROM payments WHERE payment_id = ? AND valid_to IS NULL",
            (payment_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Soft delete by setting valid_to
        now = datetime.now().isoformat()
        cursor = conn.execute(
            "UPDATE payments SET valid_to = ? WHERE payment_id = ?",
            (now, payment_id)
        )
        conn.commit()
        
        # Get updated payment
        cursor = conn.execute("SELECT * FROM payments WHERE payment_id = ?", (payment_id,))
        row = cursor.fetchone()
        
        return PaymentModel.model_validate(dict(row))

# ----- PAYMENT VIEWS -----
@router.get("/payments", response_model=PaymentViewResponse)
async def get_payments(
    client_id: Optional[int] = Query(None),
    is_split: Optional[bool] = Query(None, description="Filter for split payments only"),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get payments with optional client filter.
    Uses the v_payments view.
    """
    with get_connection() as conn:
        # Base query
        query = """
        SELECT p.*, c.display_name
        FROM v_payments p
        LEFT JOIN clients c ON p.client_id = c.client_id
        WHERE p.valid_to IS NULL
        """
        
        # Params for safe queries
        params = []
        
        # Add filters if needed
        if client_id is not None:
            query += " AND p.client_id = ?"
            params.append(client_id)
        
        if is_split is not None:
            query += " AND p.is_split_payment = ?"
            params.append(1 if is_split else 0)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination and sort
        query += " ORDER BY p.received_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute and convert to models
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        payments = [PaymentViewModel.model_validate(dict(row)) for row in rows]
        
        return PaymentViewResponse(items=payments, total=total)

@router.get("/split-payments", response_model=SplitPaymentDistributionResponse)
async def get_split_payment_distributions(
    payment_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get split payment distributions with optional filtering.
    Uses the v_split_payment_distribution view.
    """
    with get_connection() as conn:
        # Start with base query
        query = "SELECT * FROM v_split_payment_distribution"
        params = []
        conditions = []
        
        # Add filters if provided
        if payment_id is not None:
            conditions.append("payment_id = ?")
            params.append(payment_id)
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
        
        # Combine conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Count total for pagination
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY received_date DESC, period_key ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute query
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert rows to Pydantic models
        distributions = [SplitPaymentDistributionViewModel.model_validate(dict(row)) for row in rows]
        
        return SplitPaymentDistributionResponse(items=distributions, total=total)

@router.get("/payments/{payment_id}/distributions", response_model=SplitPaymentDistributionResponse)
async def get_payment_distributions(payment_id: int):
    """
    Retrieve all distribution details for a specific split payment.
    """
    with get_connection() as conn:
        query = """
        SELECT * FROM v_split_payment_distribution
        WHERE payment_id = ?
        ORDER BY period_key ASC
        """
        
        cursor = conn.execute(query, (payment_id,))
        rows = cursor.fetchall()
        
        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"Payment with ID {payment_id} not found or is not a split payment"
            )
        
        distributions = [SplitPaymentDistributionViewModel.model_validate(dict(row)) for row in rows]
        
        return SplitPaymentDistributionResponse(items=distributions, total=len(distributions))

@router.get("/expanded-payment-periods", response_model=ExpandedPaymentPeriodResponse)
async def get_expanded_payment_periods(
    payment_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    period_key: Optional[int] = Query(None),
    payment_schedule: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get expanded payment periods (one row per payment per covered period)
    """
    with get_connection() as conn:
        query = "SELECT * FROM v_expanded_payment_periods"
        conditions = []
        params = []
        
        # Add filters
        if payment_id is not None:
            conditions.append("payment_id = ?")
            params.append(payment_id)
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
        
        if period_key is not None:
            conditions.append("period_key = ?")
            params.append(period_key)
        
        if payment_schedule is not None:
            conditions.append("payment_schedule = ?")
            params.append(payment_schedule)
        
        # Combine conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY payment_id, period_key LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute query
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        periods = [ExpandedPaymentPeriodViewModel.model_validate(dict(row)) for row in rows]
        
        return ExpandedPaymentPeriodResponse(items=periods, total=total)

@router.get("/payment-coverage", response_model=PaymentPeriodCoverageResponse)
async def get_payment_coverage(
    payment_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    is_split: Optional[bool] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get detailed period coverage information for payments
    """
    with get_connection() as conn:
        query = "SELECT * FROM v_payment_period_coverage"
        conditions = []
        params = []
        
        # Add filters
        if payment_id is not None:
            conditions.append("payment_id = ?")
            params.append(payment_id)
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
        
        if is_split is not None:
            conditions.append("is_split_payment = ?")
            params.append(1 if is_split else 0)
        
        # Combine conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY received_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute query
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        coverage = [PaymentPeriodCoverageViewModel.model_validate(dict(row)) for row in rows]
        
        return PaymentPeriodCoverageResponse(items=coverage, total=total)

@router.get("/current-period", response_model=CurrentPeriodViewModel)
async def get_current_period():
    """
    Get the current billing periods (monthly and quarterly)
    """
    with get_connection() as conn:
        cursor = conn.execute("SELECT * FROM v_current_period")
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Current period information not found")
        
        return CurrentPeriodViewModel.model_validate(dict(row))

@router.get("/payment-status", response_model=PaymentStatusResponse)
async def get_payment_status(
    client_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, description="Filter by status (Paid/Unpaid)"),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get the payment status (Paid/Unpaid) for clients in the current period
    """
    with get_connection() as conn:
        query = "SELECT * FROM v_current_period_payment_status"
        conditions = []
        params = []
        
        # Add filters
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if status is not None:
            conditions.append("status = ?")
            params.append(status)
            
        # Combine conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY client_id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute query
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        statuses = [PaymentStatusViewModel.model_validate(dict(row)) for row in rows]
        
        return PaymentStatusResponse(items=statuses, total=total)