# API Integration Guide for 401k Payment Tracker

This guide outlines how to connect the frontend components to your FastAPI backend. The frontend is structured around displaying client information and payment tracking. Each component requires specific data that should be provided by appropriate API endpoints.

## Frontend Structure Overview

The frontend is organized around these main features:
- Client selection and viewing
- Payment tracking and status
- Payment history
- Payment creation

## Setting Up Your API Integration

1. Configure environment variable in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000  # Or your API's location
   ```

2. Update the data hooks in `src/hooks` to fetch from your API

3. Implement React Query or a similar library for better data fetching (optional but recommended)

## Suggested API Improvements

1. **Implement React Query**
   - Add `@tanstack/react-query` for better data handling
   - Create a common API client for consistent error handling

2. **Use Direct API Calls**
   - Component hooks should call your FastAPI backend directly
   - No intermediate Next.js API layer needed

## Component Data Requirements

Each component has specific data requirements. See `COMPONENT_DATA_NEEDS.md` for detailed information about:
- What each component displays
- What data it requires
- Source tables/views for that data

## Data Hooks

Two main hooks manage data fetching:

1. **useClientData** (`src/hooks/use-client-data.ts`)
   - Needs client listing, current client details, period information
   - Update to fetch from FastAPI endpoints

2. **usePaymentData** (`src/hooks/use-payment-data.ts`)
   - Needs payment listing, creation functionality
   - Update to fetch from FastAPI endpoints

## Recommended FastAPI Structure

While you have freedom to implement your API as desired, these endpoints would efficiently serve the frontend components:

1. `/api/clients` - List all clients
2. `/api/clients/{client_id}` - Get specific client details
3. `/api/periods/current` - Get current period information
4. `/api/clients/{client_id}/payments` - Get/create payments for a client

## Database Views

The frontend expects certain data structures that were previously implemented as views:

1. **Current Period** - Information about the current time periods
2. **Active Contracts** - Current client contracts
3. **Payment Status** - Status for current period
4. **Payment Coverage** - For split payments

These can be implemented as actual database views, query functions, or Pydantic models in FastAPI.

## Getting Started

1. Review `COMPONENT_DATA_NEEDS.md` to understand component requirements
2. Design your API based on those needs
3. Update the data hooks to use your API
4. Test with the existing frontend components 


/// 


OKAY NOW... 