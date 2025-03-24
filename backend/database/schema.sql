-- TABLE DEFINITIONS
-- client_folders
CREATE TABLE client_folders (
    client_id INTEGER PRIMARY KEY,
    actual_folder_name TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);
-- client_providers
CREATE TABLE client_providers (
    client_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER DEFAULT 1,
    PRIMARY KEY (client_id, provider_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
);
-- clients
CREATE TABLE "clients" (
  client_id INTEGER PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  full_name TEXT,
  ima_signed_date TEXT,
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_to DATETIME
);
-- contacts
CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    contact_type TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    fax TEXT,
    physical_address TEXT,
    mailing_address TEXT,
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_to DATETIME,
    FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);
-- contracts
CREATE TABLE "contracts" (
  contract_id INTEGER PRIMARY KEY NOT NULL,
  client_id INTEGER NOT NULL,
  contract_number TEXT,
  provider_id INTEGER,
  fee_type TEXT,
  percent_rate REAL,
  flat_rate REAL,
  payment_schedule TEXT,
  num_people INTEGER,
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_to DATETIME,
  is_active INTEGER NOT NULL DEFAULT 1
);
-- date_dimension
CREATE TABLE date_dimension (
  period_date TEXT PRIMARY KEY,            -- YYYY-MM-DD for first day of period
  year INTEGER NOT NULL,                   -- Year component (YYYY)
  month INTEGER,                           -- Month component (1-12)
  month_name TEXT,                         -- Jan, Feb, etc.
  quarter INTEGER,                         -- Quarter component (1-4)
  period_key_monthly INTEGER NOT NULL,     -- YYYYMM format
  period_key_quarterly INTEGER NOT NULL,   -- YYYYQ format
  display_label_monthly TEXT NOT NULL,     -- "Jan 2023", etc.
  display_label_quarterly TEXT NOT NULL,   -- "Q1 2023", etc.
  is_current_monthly INTEGER DEFAULT 0,    -- 1 if this is current monthly period (today-1 month)
  is_current_quarterly INTEGER DEFAULT 0,  -- 1 if this is current quarterly period (today-1 quarter)
  is_previous_month INTEGER DEFAULT 0,     -- For easy filtering
  is_previous_quarter INTEGER DEFAULT 0    -- For easy filtering
);
-- document_clients
CREATE TABLE document_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    UNIQUE(document_id, client_id)
);
-- documents
CREATE TABLE documents (
    document_id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    received_date TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    metadata TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
);
-- payment_documents
CREATE TABLE payment_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    document_id INTEGER NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    UNIQUE(payment_id, document_id)
);
-- payments
CREATE TABLE "payments" (
	"payment_id"	INTEGER NOT NULL,
	"contract_id"	INTEGER NOT NULL,
	"client_id"	INTEGER NOT NULL,
	"received_date"	TEXT,
	"total_assets"	INTEGER,
	"actual_fee"	REAL,
	"method"	TEXT,
	"notes"	TEXT,
	"valid_from"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"valid_to"	DATETIME,
	"applied_start_month"	INTEGER,
	"applied_start_month_year"	INTEGER,
	"applied_end_month"	INTEGER,
	"applied_end_month_year"	INTEGER,
	"applied_start_quarter"	INTEGER,
	"applied_start_quarter_year"	INTEGER,
	"applied_end_quarter"	INTEGER,
	"applied_end_quarter_year"	INTEGER,
	PRIMARY KEY("payment_id" AUTOINCREMENT),
	FOREIGN KEY("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE,
	FOREIGN KEY("contract_id") REFERENCES "contracts"("contract_id") ON DELETE CASCADE
);
-- providers
CREATE TABLE "providers" (
  provider_id INTEGER PRIMARY KEY,
  provider_name TEXT NOT NULL,
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_to DATETIME
);
-- VIEW DEFINITIONS
-- v_active_contracts
CREATE VIEW v_active_contracts AS
SELECT
  c.*
FROM contracts c
WHERE is_active = 1 AND valid_to IS NULL;
-- v_all_missing_payment_periods
CREATE VIEW v_all_missing_payment_periods AS
SELECT
  e.client_id,
  e.payment_schedule,
  e.period_key,
  e.period_label,
  'Missing' AS status
FROM v_client_expected_periods e
LEFT JOIN v_expanded_payment_periods p ON
  e.client_id = p.client_id AND
  e.period_key = p.period_key AND
  e.payment_schedule = p.payment_schedule
WHERE p.payment_id IS NULL;
-- v_client_expected_periods
CREATE VIEW v_client_expected_periods AS
WITH
  -- Get first payment or client start date, whichever is earlier
  client_start AS (
    SELECT
      c.client_id,
      c.payment_schedule,
      COALESCE(
        MIN(cp.start_date),
        MIN(p.received_date)
      ) AS start_date
    FROM v_active_contracts c
    LEFT JOIN client_providers cp ON c.client_id = cp.client_id
    LEFT JOIN payments p ON c.client_id = p.client_id
    GROUP BY c.client_id, c.payment_schedule
  ),
  -- Convert start date to period keys
  date_info AS (
    SELECT
      cs.client_id,
      cs.payment_schedule,
      cs.start_date,
      CAST(strftime('%Y', cs.start_date) AS INTEGER) AS start_year,
      CAST(strftime('%m', cs.start_date) AS INTEGER) AS start_month,
      CASE
        WHEN CAST(strftime('%m', cs.start_date) AS INTEGER) <= 3 THEN 1
        WHEN CAST(strftime('%m', cs.start_date) AS INTEGER) <= 6 THEN 2
        WHEN CAST(strftime('%m', cs.start_date) AS INTEGER) <= 9 THEN 3
        ELSE 4
      END AS start_quarter
    FROM client_start cs
  ),
  -- Get current period information
  current_period AS (
    SELECT
      current_monthly_key,
      current_quarterly_key
    FROM v_current_period
  )
SELECT
  di.client_id,
  di.payment_schedule,
  dd.period_key_monthly,
  dd.period_key_quarterly,
  CASE
    WHEN di.payment_schedule = 'monthly' THEN dd.period_key_monthly
    ELSE dd.period_key_quarterly
  END AS period_key,
  CASE
    WHEN di.payment_schedule = 'monthly' THEN dd.display_label_monthly
    ELSE dd.display_label_quarterly
  END AS period_label
FROM date_info di
CROSS JOIN date_dimension dd
CROSS JOIN current_period cp
WHERE
  -- Include only relevant periods based on payment schedule
  (
    (di.payment_schedule = 'monthly') OR
    (di.payment_schedule = 'quarterly' AND dd.month IN (1, 4, 7, 10))
  )
  -- Include periods from client start to current period
  AND (
    (di.payment_schedule = 'monthly' AND
     dd.period_key_monthly >= (di.start_year * 100 + di.start_month) AND
     dd.period_key_monthly <= cp.current_monthly_key)
    OR
    (di.payment_schedule = 'quarterly' AND
     dd.period_key_quarterly >= (di.start_year * 10 + di.start_quarter) AND
     dd.period_key_quarterly <= cp.current_quarterly_key AND
     dd.month IN (1, 4, 7, 10))
  );
-- v_client_payment_first
CREATE VIEW v_client_payment_first AS
SELECT
  c.client_id,
  c.display_name,
  MIN(p.payment_id) AS first_payment_id,
  MIN(p.received_date) AS first_payment_date,
  (SELECT p2.actual_fee
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date ASC
   LIMIT 1) AS first_payment_amount,
  (SELECT p2.method
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date ASC
   LIMIT 1) AS first_payment_method,
  (SELECT p2.total_assets
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date ASC
   LIMIT 1) AS first_payment_assets,
  CASE
    WHEN (SELECT payment_schedule FROM contracts WHERE client_id = c.client_id AND is_active = 1 AND valid_to IS NULL LIMIT 1) = 'monthly' THEN
      (SELECT p2.applied_start_month_year * 100 + p2.applied_start_month
       FROM payments p2
       WHERE p2.client_id = c.client_id
       AND p2.valid_to IS NULL
       ORDER BY p2.received_date ASC
       LIMIT 1)
    ELSE
      (SELECT p2.applied_start_quarter_year * 10 + p2.applied_start_quarter
       FROM payments p2
       WHERE p2.client_id = c.client_id
       AND p2.valid_to IS NULL
       ORDER BY p2.received_date ASC
       LIMIT 1)
  END AS first_payment_period_key,
  (SELECT
     CASE
       WHEN payment_schedule = 'monthly' THEN
         (SELECT display_label_monthly
          FROM date_dimension
          WHERE period_key_monthly = (p2.applied_start_month_year * 100 + p2.applied_start_month)
          LIMIT 1)
       ELSE
         (SELECT display_label_quarterly
          FROM date_dimension
          WHERE period_key_quarterly = (p2.applied_start_quarter_year * 10 + p2.applied_start_quarter)
          LIMIT 1)
     END
   FROM payments p2
   JOIN contracts ct ON p2.client_id = ct.client_id AND ct.is_active = 1 AND ct.valid_to IS NULL
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date ASC
   LIMIT 1) AS first_payment_period
FROM clients c
LEFT JOIN payments p ON c.client_id = p.client_id AND p.valid_to IS NULL
WHERE c.valid_to IS NULL
GROUP BY c.client_id, c.display_name
HAVING COUNT(p.payment_id) > 0;
-- v_client_payment_last
CREATE VIEW v_client_payment_last AS
SELECT
  c.client_id,
  c.display_name,
  (SELECT p2.payment_id
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date DESC
   LIMIT 1) AS last_payment_id,
  MAX(p.received_date) AS last_payment_date,
  (SELECT p2.actual_fee
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date DESC
   LIMIT 1) AS last_payment_amount,
  (SELECT p2.method
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date DESC
   LIMIT 1) AS last_payment_method,
  (SELECT p2.total_assets
   FROM payments p2
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date DESC
   LIMIT 1) AS last_payment_assets,
  CASE
    WHEN (SELECT payment_schedule FROM contracts WHERE client_id = c.client_id AND is_active = 1 AND valid_to IS NULL LIMIT 1) = 'monthly' THEN
      (SELECT p2.applied_start_month_year * 100 + p2.applied_start_month
       FROM payments p2
       WHERE p2.client_id = c.client_id
       AND p2.valid_to IS NULL
       ORDER BY p2.received_date DESC
       LIMIT 1)
    ELSE
      (SELECT p2.applied_start_quarter_year * 10 + p2.applied_start_quarter
       FROM payments p2
       WHERE p2.client_id = c.client_id
       AND p2.valid_to IS NULL
       ORDER BY p2.received_date DESC
       LIMIT 1)
  END AS last_payment_period_key,
  (SELECT
     CASE
       WHEN payment_schedule = 'monthly' THEN
         (SELECT display_label_monthly
          FROM date_dimension
          WHERE period_key_monthly = (p2.applied_start_month_year * 100 + p2.applied_start_month)
          LIMIT 1)
       ELSE
         (SELECT display_label_quarterly
          FROM date_dimension
          WHERE period_key_quarterly = (p2.applied_start_quarter_year * 10 + p2.applied_start_quarter)
          LIMIT 1)
     END
   FROM payments p2
   JOIN contracts ct ON p2.client_id = ct.client_id AND ct.is_active = 1 AND ct.valid_to IS NULL
   WHERE p2.client_id = c.client_id
   AND p2.valid_to IS NULL
   ORDER BY p2.received_date DESC
   LIMIT 1) AS last_payment_period,
  JULIANDAY(CURRENT_DATE) - JULIANDAY(MAX(p.received_date)) AS days_since_last_payment
FROM clients c
LEFT JOIN payments p ON c.client_id = p.client_id AND p.valid_to IS NULL
WHERE c.valid_to IS NULL
GROUP BY c.client_id, c.display_name
HAVING COUNT(p.payment_id) > 0;
-- v_current_period
CREATE VIEW v_current_period AS
WITH current_info AS (
  SELECT
    CURRENT_DATE as today,
    cast(strftime('%Y', CURRENT_DATE) as integer) as current_year,
    cast(strftime('%m', CURRENT_DATE) as integer) as current_month,
    CASE
      WHEN cast(strftime('%m', CURRENT_DATE) as integer) = 1 THEN 12
      ELSE cast(strftime('%m', CURRENT_DATE) as integer) - 1
    END as current_month_for_billing,
    CASE
      WHEN cast(strftime('%m', CURRENT_DATE) as integer) = 1 THEN cast(strftime('%Y', CURRENT_DATE) as integer) - 1
      ELSE cast(strftime('%Y', CURRENT_DATE) as integer)
    END as current_month_year_for_billing,
    CASE
      WHEN cast(strftime('%m', CURRENT_DATE) as integer) <= 3 THEN 4
      WHEN cast(strftime('%m', CURRENT_DATE) as integer) <= 6 THEN 1
      WHEN cast(strftime('%m', CURRENT_DATE) as integer) <= 9 THEN 2
      ELSE 3
    END as current_quarter_for_billing,
    CASE
      WHEN cast(strftime('%m', CURRENT_DATE) as integer) <= 3 THEN cast(strftime('%Y', CURRENT_DATE) as integer) - 1
      ELSE cast(strftime('%Y', CURRENT_DATE) as integer)
    END as current_quarter_year_for_billing
)
SELECT
  *,
  (current_month_year_for_billing * 100) + current_month_for_billing as current_monthly_key,
  (current_quarter_year_for_billing * 10) + current_quarter_for_billing as current_quarterly_key
FROM current_info;
-- v_current_period_payment_status
CREATE VIEW v_current_period_payment_status AS
SELECT
  c.client_id,
  c.payment_schedule,
  CASE
    WHEN c.payment_schedule = 'monthly' THEN dm.period_key_monthly
    ELSE dq.period_key_quarterly
  END AS period_key,
  CASE
    WHEN c.payment_schedule = 'monthly' THEN dm.display_label_monthly
    ELSE dq.display_label_quarterly
  END AS period_label,
  CASE
    WHEN pe.payment_id IS NOT NULL THEN 'Paid'
    ELSE 'Unpaid'
  END AS status
FROM v_active_contracts c
CROSS JOIN (
  SELECT * FROM date_dimension WHERE is_current_monthly = 1
) dm
CROSS JOIN (
  SELECT * FROM date_dimension WHERE is_current_quarterly = 1
) dq
LEFT JOIN v_expanded_payment_periods pe ON
  c.client_id = pe.client_id AND
  ((c.payment_schedule = 'monthly' AND pe.period_key = dm.period_key_monthly) OR
   (c.payment_schedule = 'quarterly' AND pe.period_key = dq.period_key_quarterly));
-- v_expanded_payment_periods
CREATE VIEW v_expanded_payment_periods AS
SELECT
    p.payment_id,
    p.client_id,
    dd.period_key_monthly AS period_key,
    'monthly' AS payment_schedule
FROM v_payments p
JOIN date_dimension dd ON
    dd.period_key_monthly BETWEEN
        (p.applied_start_month_year * 100 + p.applied_start_month) AND
        (p.applied_end_month_year * 100 + p.applied_end_month)
WHERE p.applied_start_month IS NOT NULL AND p.valid_to IS NULL
UNION ALL
SELECT
    p.payment_id,
    p.client_id,
    dd.period_key_quarterly AS period_key,
    'quarterly' AS payment_schedule
FROM v_payments p
JOIN date_dimension dd ON
    dd.period_key_quarterly BETWEEN
        (p.applied_start_quarter_year * 10 + p.applied_start_quarter) AND
        (p.applied_end_quarter_year * 10 + p.applied_end_quarter)
    AND dd.month IN (1, 4, 7, 10)
WHERE p.applied_start_quarter IS NOT NULL AND p.valid_to IS NULL;
-- v_payment_period_coverage
CREATE VIEW v_payment_period_coverage AS
SELECT
    p.payment_id,
    p.client_id,
    p.received_date,
    p.actual_fee,
    p.is_split_payment,
    -- For monthly payments
    CASE WHEN p.applied_start_month IS NOT NULL THEN
        (SELECT GROUP_CONCAT(period_key_monthly || '|' || display_label_monthly, '; ')
         FROM date_dimension
         WHERE period_key_monthly BETWEEN
             (p.applied_start_month_year * 100 + p.applied_start_month) AND
             (p.applied_end_month_year * 100 + p.applied_end_month))
    ELSE NULL END AS covered_monthly_periods,
    -- For quarterly payments
    CASE WHEN p.applied_start_quarter IS NOT NULL THEN
        (SELECT GROUP_CONCAT(period_key_quarterly || '|' || display_label_quarterly, '; ')
         FROM date_dimension
         WHERE period_key_quarterly BETWEEN
             (p.applied_start_quarter_year * 10 + p.applied_start_quarter) AND
             (p.applied_end_quarter_year * 10 + p.applied_end_quarter)
             AND month IN (1, 4, 7, 10))
    ELSE NULL END AS covered_quarterly_periods,
    -- Number of periods covered (for proration calculation)
    CASE
        WHEN p.applied_start_month IS NOT NULL THEN
            (SELECT COUNT(*)
             FROM date_dimension
             WHERE period_key_monthly BETWEEN
                 (p.applied_start_month_year * 100 + p.applied_start_month) AND
                 (p.applied_end_month_year * 100 + p.applied_end_month))
        WHEN p.applied_start_quarter IS NOT NULL THEN
            (SELECT COUNT(*)
             FROM date_dimension
             WHERE period_key_quarterly BETWEEN
                 (p.applied_start_quarter_year * 10 + p.applied_start_quarter) AND
                 (p.applied_end_quarter_year * 10 + p.applied_end_quarter)
                 AND month IN (1, 4, 7, 10))
        ELSE 1
    END AS periods_covered
FROM v_payments p
WHERE p.valid_to IS NULL;
-- v_payments
CREATE VIEW v_payments AS
SELECT
  p.*,
  dm.display_label_monthly AS start_period_monthly,
  dq.display_label_quarterly AS start_period_quarterly,
  CASE
    WHEN p.applied_start_month IS NOT NULL THEN dm.period_key_monthly
    ELSE NULL
  END AS period_key_monthly,
  CASE
    WHEN p.applied_start_quarter IS NOT NULL THEN dq.period_key_quarterly
    ELSE NULL
  END AS period_key_quarterly,
  CASE
    WHEN (p.applied_start_month != p.applied_end_month OR
          p.applied_start_month_year != p.applied_end_month_year OR
          p.applied_start_quarter != p.applied_end_quarter OR
          p.applied_start_quarter_year != p.applied_end_quarter_year)
         AND p.applied_end_month IS NOT NULL
    THEN 1
    ELSE 0
  END AS is_split_payment
FROM payments p
LEFT JOIN date_dimension dm ON
  (p.applied_start_month_year * 100 + p.applied_start_month) = dm.period_key_monthly
LEFT JOIN date_dimension dq ON
  (p.applied_start_quarter_year * 10 + p.applied_start_quarter) = dq.period_key_quarterly
WHERE p.valid_to IS NULL;
-- INDEX DEFINITIONS
-- idx_document_clients_client_id
CREATE INDEX idx_document_clients_client_id ON document_clients(client_id);
-- idx_document_clients_doc_id
CREATE INDEX idx_document_clients_doc_id ON document_clients(document_id);
-- idx_payment_documents_document_id
CREATE INDEX idx_payment_documents_document_id ON payment_documents(document_id);
-- idx_payment_documents_payment_id
CREATE INDEX idx_payment_documents_payment_id ON payment_documents(payment_id);
-- idx_payments_client_date
CREATE INDEX idx_payments_client_date ON payments(client_id, received_date);
-- idx_payments_received_date
CREATE INDEX idx_payments_received_date ON payments(received_date);
-- idx_payments_valid_to
CREATE INDEX idx_payments_valid_to ON payments(valid_to);