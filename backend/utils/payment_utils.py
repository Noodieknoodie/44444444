from typing import Optional, Dict, Any
import sqlite3

def calculate_variance(payment: Dict[Any, Any], contract: Dict[Any, Any]) -> Dict[Any, Any]:
    """
    Calculate payment variance and classification
    
    Returns dict with:
        variance_amount: amount difference
        variance_percent: percentage difference
        variance_classification: Within Target, Overpaid, or Underpaid
    """
    # Don't calculate variance for split payments
    if payment.get("is_split_payment"):
        return {
            "variance_amount": None,
            "variance_percent": None,
            "variance_classification": None
        }
    
    # Calculate expected fee
    expected_fee = None
    if contract["fee_type"] == "percentage" and payment.get("total_assets"):
        expected_fee = payment["total_assets"] * contract["percent_rate"]
    elif contract["fee_type"] in ["flat", "fixed"]:
        expected_fee = contract["flat_rate"]
    
    # If we can't calculate expected fee, return None
    if expected_fee is None:
        return {
            "variance_amount": None,
            "variance_percent": None,
            "variance_classification": None
        }
    
    # Calculate variance
    variance_amount = payment["actual_fee"] - expected_fee
    
    # Calculate variance percentage
    if expected_fee != 0:
        variance_percent = (variance_amount / expected_fee) * 100
    else:
        variance_percent = 0
    
    # Classify variance
    if abs(variance_amount) <= 3:
        classification = "Within Target"
    elif variance_amount > 0:
        classification = "Overpaid"
    else:
        classification = "Underpaid"
    
    return {
        "variance_amount": variance_amount,
        "variance_percent": variance_percent,
        "variance_classification": classification
    }

def estimate_aum(client_id: int, cursor: sqlite3.Cursor) -> Optional[float]:
    """
    Estimate AUM for a client with missing data by using the most recent known value
    """
    cursor.execute("""
        SELECT total_assets 
        FROM payments 
        WHERE client_id = ? AND total_assets IS NOT NULL 
        ORDER BY received_date DESC 
        LIMIT 1
    """, (client_id,))
    
    result = cursor.fetchone()
    
    if result:
        return result["total_assets"]
    
    return None

def get_expected_fee(client_id: int, aum: Optional[float], cursor: sqlite3.Cursor) -> Dict[Any, Any]:
    """
    Calculate expected fee based on contract terms and AUM
    """
    # Get contract terms
    cursor.execute("""
        SELECT 
            fee_type, 
            percent_rate, 
            flat_rate 
        FROM v_active_contracts 
        WHERE client_id = ?
    """, (client_id,))
    
    contract = cursor.fetchone()
    
    if not contract:
        return {
            "expected_fee": None,
            "is_estimated": False
        }
    
    # If AUM is None for percentage-based fee, try to estimate
    if contract["fee_type"] == "percentage" and aum is None:
        aum = estimate_aum(client_id, cursor)
        is_estimated = aum is not None
    else:
        is_estimated = False
    
    # Calculate expected fee
    if contract["fee_type"] == "percentage" and aum is not None:
        expected_fee = aum * contract["percent_rate"]
    elif contract["fee_type"] in ["flat", "fixed"]:
        expected_fee = contract["flat_rate"]
        is_estimated = False
    else:
        expected_fee = None
        is_estimated = False
    
    return {
        "expected_fee": expected_fee,
        "is_estimated": is_estimated
    }