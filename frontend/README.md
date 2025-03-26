# 401(k) Payment Tracking System - Frontend

This is the frontend for the 401(k) Payment Tracking System, built with Next.js and TypeScript.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000.

## API Integration

The frontend communicates with the backend API through a strongly-typed API client. The integration is structured as follows:

- `src/app/api.ts`: API client with interfaces and request/response handling
- `src/app/hooks/useApi.ts`: React hooks for data fetching and state management

## Component Structure

The application uses a component-based architecture:

- `src/app/components/ui/`: Reusable UI components
- `src/app/utils/`: Utility functions for formatting, validation, etc.
- `src/app/dashboard/`: Dashboard page with client and payment status views

## Testing

The project includes unit tests for the API client, hooks, and utility functions. To run tests:

```bash
npm test
```

For development with watch mode:

```bash
npm run test:watch
```

## Adding New Features

1. Define interfaces in `api.ts` for new data types
2. Add API endpoints to the appropriate section in the API client
3. Create React hooks in `useApi.ts` for the new endpoints
4. Build UI components that use the hooks

## Business Logic Notes

- All payments are in arrears (current month/quarter - 1)
- Monthly and quarterly payment schedules are supported
- Payment status is either "Paid" or "Unpaid"
- Fees can be flat or percentage-based