# Frontend Component Data Requirements

This document outlines the data needs of each frontend component in the application. It's organized by component, showing what data each visual element needs to function.

## Client List and Selection

### Component: App Sidebar (`src/components/app-sidebar.tsx`)
**Function:** Displays a list of clients that users can select from
**Data Needed:** 
- List of all clients with their display names
- Source: `clients` table
- Fields needed: client_id, display_name

## Client Overview

### Component: Client Header (`src/components/client-header.tsx`)
**Function:** Displays client overview information at the top of the page
**Data Needed:**
- Client basic information
- Source: `clients`, `active_contracts`, `providers` tables
- Fields needed: display_name, full_name, ima_signed_date, provider_name, payment_schedule, fee_type, percent_rate/flat_rate

### Component: Quarterly Status (`src/components/quarterly-status.tsx`)
**Function:** Shows payment status for current period
**Data Needed:**
- Current period information
- Client payment status for current period
- Missing payment periods
- Source: `current_period`, `current_period_payment_status`, `all_missing_payment_periods` views 
- Fields needed: period_label, status, missing periods list

### Component: Last Payment Summary (`src/components/last-payment-summary.tsx`)
**Function:** Shows summary of most recent payment
**Data Needed:**
- Most recent payment details
- Source: `payments` table
- Fields needed: received_date, total_assets, actual_fee

## Payment Management

### Component: Payment History (`src/components/payment-history.tsx`)
**Function:** Displays table of all client payments with pagination
**Data Needed:**
- Paginated list of payments
- Calculated expected fee and variance
- Split payment details if applicable
- Source: `payments`, `active_contracts`, `payment_period_coverage`, `expanded_payment_periods` views
- Fields needed: payment_id, received_date, total_assets, actual_fee, method, notes, period information, expected_fee, variance

### Component: Add Payment Card (`src/components/add-payment-card.tsx`)
**Function:** Form to add new payments
**Data Needed:**
- Contract details to calculate fees
- Available payment periods
- Source: `active_contracts` table/view, `date_dimension` for period options
- Fields needed for submission: received_date, total_assets, actual_fee, period information

## Future Components

### Component: Notification Center (`src/components/notification-center.tsx`)
**Function:** Displays payment notifications and alerts
**Data Needed:** 
- List of notifications about upcoming and overdue payments
- Source: Would need new notifications data
- Fields needed: notification type, message, timestamp, related client/payment

### Component: PDF Viewer (`src/components/pdf-viewer.tsx`)
**Function:** Views payment receipts and documents
**Data Needed:**
- Document binary data
- Document metadata
- Source: Would need new documents storage
- Fields needed: document_id, file_data, document_title, related_payment_id

## Data Hooks

### Hook: useClientData (`src/hooks/use-client-data.ts`)
**Function:** Provides client data to components
**Data Needed:**
- List of all clients
- Current period information
- Selected client details
- Sources: See Client List and Client Overview sections

### Hook: usePaymentData (`src/hooks/use-payment-data.ts`)
**Function:** Provides payment data and operations to components
**Data Needed:**
- Client payment history with pagination
- Ability to add new payments
- Sources: See Payment History and Add Payment Card sections

## Core Views Required

These data views are referenced by components and should be implemented in the backend:

1. **Current Period** - Information about the current monthly/quarterly periods
2. **Active Contracts** - Current active client contracts
3. **Current Period Payment Status** - Payment status for the current period per client
4. **Missing Payment Periods** - Periods where payments are expected but missing
5. **Payment Period Coverage** - Details about which periods a payment covers
6. **Expanded Payment Periods** - For handling split payments across multiple periods 