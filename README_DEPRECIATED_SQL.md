# README_DEPRECIATED_SQL.md

// BELOW IS THE SQL CODE FOR THE DEPRECIATED VIEWS. Consider the underlying logic and determine if it's worth incorporating into the app layer or if it would cause undue complexity.

### 1. AUM Estimation Logic
```sql
-- Previously in v_client_aum_history
SELECT 
    client_id, 
    period_key,
    CASE 
        WHEN p.total_assets IS NOT NULL THEN p.total_assets
        ELSE (
            SELECT p_prev.total_assets 
            FROM payments p_prev 
            WHERE p_prev.client_id = p.client_id 
              AND p_prev.total_assets IS NOT NULL
              AND period_key_prev < period_key
            ORDER BY period_key_prev DESC 
            LIMIT 1
        )
    END as estimated_aum,
    CASE 
        WHEN p.total_assets IS NULL THEN 1
        ELSE 0
    END as is_estimated
```

### 2. Fee Estimation Logic
```sql
-- Previously in v_expected_fees_with_estimates
CASE 
    WHEN con.fee_type = 'percentage' AND p.total_assets IS NULL 
    THEN (SELECT estimated_aum FROM v_client_aum_history WHERE client_id = p.client_id 
          AND period_key = p.period_key LIMIT 1) * con.percent_rate
    WHEN con.fee_type = 'flat' 
    THEN con.flat_rate
    ELSE NULL
END as estimated_expected_fee,
CASE 
    WHEN con.fee_type = 'percentage' AND p.total_assets IS NULL AND
         EXISTS (SELECT 1 FROM v_client_aum_history WHERE client_id = p.client_id AND is_estimated = 1)
    THEN 1
    ELSE 0
END AS is_estimated_fee
```


### 4. Variance Classification Logic
```sql
-- Previously in v_payment_variance
CASE 
    WHEN (p.applied_start_month IS NOT NULL AND 
         (p.applied_start_month != p.applied_end_month OR 
          p.applied_start_month_year != p.applied_end_month_year)) OR
         (p.applied_start_quarter IS NOT NULL AND 
         (p.applied_start_quarter != p.applied_end_quarter OR 
          p.applied_start_quarter_year != p.applied_end_quarter_year))
    THEN NULL -- Mute classification for split payments
    WHEN con.fee_type = 'percentage' AND p.total_assets IS NOT NULL 
    THEN 
        CASE
            WHEN ABS(p.actual_fee - (p.total_assets * con.percent_rate)) <= 3 THEN 'Within Target'
            WHEN p.actual_fee > (p.total_assets * con.percent_rate) THEN 'Overpaid'
            ELSE 'Underpaid'
        END
    WHEN con.fee_type = 'flat' 
    THEN 
        CASE
            WHEN ABS(p.actual_fee - con.flat_rate) <= 3 THEN 'Within Target'
            WHEN p.actual_fee > con.flat_rate THEN 'Overpaid'
            ELSE 'Underpaid'
        END
    ELSE NULL
END AS variance_classification
```

### 5. Estimated Variance Logic
```sql
-- Previously in v_payment_variance_with_estimates
CASE 
    WHEN (p.applied_start_month IS NOT NULL AND 
         (p.applied_start_month != p.applied_end_month OR 
          p.applied_start_month_year != p.applied_end_month_year)) OR
         (p.applied_start_quarter IS NOT NULL AND 
         (p.applied_start_quarter != p.applied_end_quarter OR 
          p.applied_start_quarter_year != p.applied_end_quarter_year))
    THEN NULL -- Mute variance for split payments
    WHEN con.fee_type = 'percentage' AND p.total_assets IS NULL AND
         EXISTS (SELECT 1 FROM v_client_aum_history WHERE client_id = p.client_id AND is_estimated = 1)
    THEN (SELECT ROUND(p.actual_fee - (estimated_aum * con.percent_rate), 2) 
          FROM v_client_aum_history 
          WHERE client_id = p.client_id AND period_key = p.period_key LIMIT 1)
    ELSE NULL
END AS estimated_variance_amount
```

### 6. Split Payment Period Formatting
```sql
-- Previously in v_payments_expanded
CASE
    WHEN p.applied_start_month IS NOT NULL THEN
        CASE 
            WHEN p.applied_start_month = 1 THEN 'Jan'
            WHEN p.applied_start_month = 2 THEN 'Feb'
            WHEN p.applied_start_month = 3 THEN 'Mar'
            WHEN p.applied_start_month = 4 THEN 'Apr'
            WHEN p.applied_start_month = 5 THEN 'May'
            WHEN p.applied_start_month = 6 THEN 'Jun'
            WHEN p.applied_start_month = 7 THEN 'Jul'
            WHEN p.applied_start_month = 8 THEN 'Aug'
            WHEN p.applied_start_month = 9 THEN 'Sep'
            WHEN p.applied_start_month = 10 THEN 'Oct'
            WHEN p.applied_start_month = 11 THEN 'Nov'
            WHEN p.applied_start_month = 12 THEN 'Dec'
        END || ' ' || p.applied_start_month_year
    ELSE 
        'Q' || p.applied_start_quarter || ' ' || p.applied_start_quarter_year
END AS period_start_formatted,

CASE
    WHEN (p.applied_start_month IS NOT NULL AND 
         (p.applied_start_month != p.applied_end_month OR 
          p.applied_start_month_year != p.applied_end_month_year)) OR
         (p.applied_start_quarter IS NOT NULL AND 
         (p.applied_start_quarter != p.applied_end_quarter OR 
          p.applied_start_quarter_year != p.applied_end_quarter_year))
    THEN 
        CASE
            WHEN p.applied_end_month IS NOT NULL THEN
                ' to ' || 
                CASE 
                    WHEN p.applied_end_month = 1 THEN 'Jan'
                    WHEN p.applied_end_month = 2 THEN 'Feb'
                    WHEN p.applied_end_month = 3 THEN 'Mar'
                    WHEN p.applied_end_month = 4 THEN 'Apr'
                    WHEN p.applied_end_month = 5 THEN 'May'
                    WHEN p.applied_end_month = 6 THEN 'Jun'
                    WHEN p.applied_end_month = 7 THEN 'Jul'
                    WHEN p.applied_end_month = 8 THEN 'Aug'
                    WHEN p.applied_end_month = 9 THEN 'Sep'
                    WHEN p.applied_end_month = 10 THEN 'Oct'
                    WHEN p.applied_end_month = 11 THEN 'Nov'
                    WHEN p.applied_end_month = 12 THEN 'Dec'
                END || ' ' || p.applied_end_month_year
            ELSE 
                ' to Q' || p.applied_end_quarter || ' ' || p.applied_end_quarter_year
        END
    ELSE ''
END AS period_end_formatted
```

### 7. Split Payment Distribution Calculation
```sql
-- Previously in payment analytics views
CASE
    -- Check if this is a split payment spanning multiple periods
    WHEN (p.applied_start_month IS NOT NULL AND 
         (p.applied_start_month != p.applied_end_month OR 
          p.applied_start_month_year != p.applied_end_month_year))
    THEN
        -- Calculate number of months in the split
        (p.applied_end_month_year * 12 + p.applied_end_month) - 
        (p.applied_start_month_year * 12 + p.applied_start_month) + 1
    
    WHEN (p.applied_start_quarter IS NOT NULL AND 
         (p.applied_start_quarter != p.applied_end_quarter OR 
          p.applied_start_quarter_year != p.applied_end_quarter_year))
    THEN
        -- Calculate number of quarters in the split
        (p.applied_end_quarter_year * 4 + p.applied_end_quarter) - 
        (p.applied_start_quarter_year * 4 + p.applied_start_quarter) + 1
    
    ELSE 1 -- Not a split payment
END AS period_count,

-- Distribute fee equally among periods
CASE
    WHEN period_count > 1 THEN p.actual_fee / period_count
    ELSE p.actual_fee
END AS distributed_fee_per_period
```

### 8. Next Due Date Calculation
```sql
-- Previously in v_client_sidebar
CASE 
    WHEN c.payment_schedule = 'monthly' THEN
        -- Add 1 month to the current period
        date(
            (SELECT period_date 
             FROM date_dimension 
             WHERE is_current_monthly = 1), 
            '+1 month')
    WHEN c.payment_schedule = 'quarterly' THEN
        -- Add 3 months to the current period
        date(
            (SELECT period_date 
             FROM date_dimension 
             WHERE is_current_quarterly = 1),
            '+3 months')
END AS next_due_date
```

### 9. Days Overdue Calculation
```sql
-- Previously in v_missing_payments
JULIANDAY(CURRENT_DATE) - 
JULIANDAY(
    CASE 
        WHEN c.payment_schedule = 'monthly' THEN
            date((SELECT period_date FROM date_dimension WHERE period_key_monthly = mp.period_key), '+1 month', '+15 days')
        ELSE
            date((SELECT period_date FROM date_dimension WHERE period_key_quarterly = mp.period_key), '+3 months', '+15 days')
    END
) AS days_overdue
```

### 10. Client Summary Statistics
```sql
-- Previously in v_client_sidebar
(SELECT COUNT(*) FROM v_missing_payments WHERE client_id = c.client_id) AS missing_payment_count,
(SELECT SUM(expected_fee) FROM v_expected_fees WHERE client_id = c.client_id AND payment_id IS NULL) AS total_outstanding_fees,
(SELECT MAX(days_overdue) FROM v_missing_payments WHERE client_id = c.client_id) AS max_days_overdue,
(SELECT COUNT(*) 
 FROM payments 
 WHERE client_id = c.client_id 
   AND valid_to IS NULL
   AND received_date >= date('now', '-12 months')
) AS payment_count_last_year
```

### 11. Payment Status with Partial Detection
```sql
-- Previously in more complex version of payment status view
CASE
    WHEN p.payment_id IS NULL THEN 'Unpaid'
    WHEN ABS(p.actual_fee - ef.expected_fee) > 3 AND p.actual_fee < ef.expected_fee THEN 'Partial'
    ELSE 'Paid'
END AS status
```

### 12. Complex Recurring Period Pattern Detection
```sql
-- Previously in payment analysis views
SELECT
    p1.client_id,
    AVG(JULIANDAY(p2.received_date) - JULIANDAY(p1.received_date)) AS avg_days_between_payments,
    STDEV(JULIANDAY(p2.received_date) - JULIANDAY(p1.received_date)) AS payment_consistency_score
FROM payments p1
JOIN payments p2 ON 
    p1.client_id = p2.client_id AND
    p1.payment_id < p2.payment_id AND
    p1.received_date < p2.received_date AND
    NOT EXISTS (
        SELECT 1 FROM payments p3
        WHERE p3.client_id = p1.client_id
          AND p3.received_date > p1.received_date
          AND p3.received_date < p2.received_date
    )
WHERE p1.valid_to IS NULL AND p2.valid_to IS NULL
GROUP BY p1.client_id
```