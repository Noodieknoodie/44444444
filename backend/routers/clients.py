from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
import sqlite3
from main import get_db_dependency

router = APIRouter()

@router.get("/")
def get_clients(db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get all clients with their payment status for the current period"""
    cursor = db.cursor()
    
    # Get all active clients with their current payment status
    query = """
    SELECT 
        c.client_id, 
        c.display_name, 
        c.full_name, 
        c.ima_signed_date,
        con.payment_schedule,
        CASE WHEN cps.status IS NULL THEN 'Unpaid' ELSE cps.status END AS current_period_status
    FROM clients c
    LEFT JOIN v_active_contracts con ON c.client_id = con.client_id
    LEFT JOIN v_current_period_payment_status cps ON c.client_id = cps.client_id
    WHERE c.valid_to IS NULL
    ORDER BY c.display_name
    """
    
    cursor.execute(query)
    clients = [dict(row) for row in cursor.fetchall()]
    
    return clients

@router.get("/{client_id}")
def get_client(client_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get detailed information about a specific client"""
    cursor = db.cursor()
    
    # Get client information
    client_query = """
    SELECT 
        c.client_id, 
        c.display_name, 
        c.full_name, 
        c.ima_signed_date,
        cpl.first_payment_date AS client_since,
        con.contract_id,
        con.contract_number,
        con.provider_id,
        p.provider_name,
        con.payment_schedule,
        con.fee_type,
        con.percent_rate,
        con.flat_rate,
        con.num_people AS participants
    FROM clients c
    LEFT JOIN v_active_contracts con ON c.client_id = con.client_id
    LEFT JOIN providers p ON con.provider_id = p.provider_id
    LEFT JOIN v_client_payment_first cpl ON c.client_id = cpl.client_id
    WHERE c.client_id = ? AND c.valid_to IS NULL
    """
    
    cursor.execute(client_query, (client_id,))
    client = cursor.fetchone()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client_dict = dict(client)
    
    # Get current payment status
    status_query = """
    SELECT 
        period_key, 
        period_label, 
        status 
    FROM v_current_period_payment_status 
    WHERE client_id = ?
    """
    
    cursor.execute(status_query, (client_id,))
    status = cursor.fetchone()
    
    if status:
        client_dict["current_period"] = {
            "period_key": status["period_key"],
            "period_label": status["period_label"],
            "status": status["status"]
        }
    
    # Get last payment
    last_payment_query = """
    SELECT 
        last_payment_id,
        last_payment_date,
        last_payment_amount,
        last_payment_method,
        last_payment_assets,
        last_payment_period,
        days_since_last_payment
    FROM v_client_payment_last
    WHERE client_id = ?
    """
    
    cursor.execute(last_payment_query, (client_id,))
    last_payment = cursor.fetchone()
    
    if last_payment:
        client_dict["last_payment"] = dict(last_payment)
    
    # Get missing periods
    missing_periods_query = """
    SELECT period_label
    FROM v_all_missing_payment_periods
    WHERE client_id = ?
    ORDER BY period_key DESC
    """
    
    cursor.execute(missing_periods_query, (client_id,))
    missing_periods = cursor.fetchall()
    
    client_dict["missing_periods"] = [row["period_label"] for row in missing_periods]
    
    return client_dict

@router.get("/{client_id}/payment-history")
def get_client_payment_history(client_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get payment history for a specific client"""
    cursor = db.cursor()
    
    # First get regular payments
    payments_query = """
    SELECT 
        p.payment_id,
        p.received_date,
        p.total_assets,
        p.actual_fee,
        p.method,
        p.notes,
        p.is_split_payment,
        CASE 
            WHEN p.period_key_monthly IS NOT NULL THEN p.period_key_monthly
            ELSE p.period_key_quarterly
        END AS period_key,
        CASE 
            WHEN p.period_key_monthly IS NOT NULL THEN p.start_period_monthly
            ELSE p.start_period_quarterly
        END AS period_label,
        pc.covered_monthly_periods,
        pc.covered_quarterly_periods,
        pc.periods_covered,
        pc.distributed_amount_per_period,
        EXISTS(SELECT 1 FROM payment_documents pd WHERE pd.payment_id = p.payment_id) AS has_document
    FROM v_payments p
    LEFT JOIN v_payment_period_coverage pc ON p.payment_id = pc.payment_id
    WHERE p.client_id = ?
    ORDER BY p.received_date DESC
    """
    
    cursor.execute(payments_query, (client_id,))
    payments = [dict(row) for row in cursor.fetchall()]
    
    # For split payments, get the details
    for payment in payments:
        if payment["is_split_payment"]:
            split_query = """
            SELECT 
                period_key,
                period_label,
                distributed_amount
            FROM v_split_payment_distribution
            WHERE payment_id = ?
            ORDER BY period_key
            """
            
            cursor.execute(split_query, (payment["payment_id"],))
            split_details = [dict(row) for row in cursor.fetchall()]
            payment["split_details"] = split_details
    
    return payments

@router.get("/{client_id}/expected-fee")
def get_expected_fee(
    client_id: int, 
    aum: Optional[float] = None,
    db: sqlite3.Connection = Depends(get_db_dependency)
):
    """Calculate expected fee for a client based on AUM and contract terms"""
    cursor = db.cursor()
    
    # Get contract terms
    contract_query = """
    SELECT 
        fee_type, 
        percent_rate, 
        flat_rate 
    FROM v_active_contracts 
    WHERE client_id = ?
    """
    
    cursor.execute(contract_query, (client_id,))
    contract = cursor.fetchone()
    
    if not contract:
        raise HTTPException(status_code=404, detail="No active contract found for client")
    
    contract_dict = dict(contract)
    
    # If AUM not provided but client uses percentage fee, try to get latest AUM
    if aum is None and contract_dict["fee_type"] == "percentage":
        aum_query = """
        SELECT total_assets 
        FROM payments 
        WHERE client_id = ? AND total_assets IS NOT NULL 
        ORDER BY received_date DESC 
        LIMIT 1
        """
        
        cursor.execute(aum_query, (client_id,))
        latest_aum = cursor.fetchone()
        
        if latest_aum:
            aum = latest_aum["total_assets"]
    
    # Calculate expected fee
    if contract_dict["fee_type"] == "percentage" and aum is not None:
        expected_fee = aum * contract_dict["percent_rate"]
        is_estimated = False
    elif contract_dict["fee_type"] == "percentage" and aum is None:
        expected_fee = None
        is_estimated = True
    elif contract_dict["fee_type"] in ["flat", "fixed"]:
        expected_fee = contract_dict["flat_rate"]
        is_estimated = False
    else:
        expected_fee = None
        is_estimated = True
    
    return {
        "client_id": client_id,
        "fee_type": contract_dict["fee_type"],
        "percent_rate": contract_dict["percent_rate"],
        "flat_rate": contract_dict["flat_rate"],
        "aum": aum,
        "expected_fee": expected_fee,
        "is_estimated": is_estimated
    }