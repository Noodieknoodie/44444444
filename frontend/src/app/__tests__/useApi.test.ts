/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useApiOperation, useClients, useCurrentPeriod } from '../hooks/useApi';

// Mock the API client
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    clients: {
      getClients: jest.fn(),
    },
    payments: {
      getCurrentPeriod: jest.fn(),
    },
  },
}));

import api from '../api';

describe('useApiOperation hook', () => {
  test('should handle loading state correctly', async () => {
    // Create a mock operation that returns a promise
    const mockOperation = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
    );

    // Render the hook
    const { result } = renderHook(() => useApiOperation(mockOperation));

    // Initial state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);

    // Start the operation
    let promise;
    act(() => {
      promise = result.current.execute();
    });

    // Should be in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for operation to complete
    await act(async () => {
      await promise;
    });

    // Should be done loading with data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ data: 'test' });
  });

  test('should handle errors correctly', async () => {
    // Create a mock operation that throws an error
    const mockError = new Error('Test error');
    const mockOperation = jest.fn().mockRejectedValue(mockError);

    // Render the hook
    const { result } = renderHook(() => useApiOperation(mockOperation));

    // Start the operation
    let promise;
    act(() => {
      promise = result.current.execute().catch(() => {}); // Catch the error to prevent test failure
    });

    // Wait for operation to complete
    await act(async () => {
      await promise;
    });

    // Should have error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBe(null);
  });

  test('should reset state correctly', async () => {
    // Create a mock operation
    const mockOperation = jest.fn().mockResolvedValue({ data: 'test' });

    // Render the hook
    const { result } = renderHook(() => useApiOperation(mockOperation));

    // Execute operation
    await act(async () => {
      await result.current.execute();
    });

    // Should have data
    expect(result.current.data).toEqual({ data: 'test' });

    // Reset the state
    act(() => {
      result.current.reset();
    });

    // State should be reset
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });
});

describe('Client API hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('useClients hook should call api.clients.getClients', async () => {
    // Mock implementation
    const mockClientsData = { items: [{ client_id: 1, display_name: 'Test' }], total: 1 };
    (api.clients.getClients as jest.Mock).mockResolvedValue(mockClientsData);

    // Render the hook
    const { result } = renderHook(() => useClients());

    // Execute the getClients function
    await act(async () => {
      await result.current.getClients();
    });

    // Check that the API was called
    expect(api.clients.getClients).toHaveBeenCalled();
    
    // Check that the data was set correctly
    expect(result.current.clients).toEqual(mockClientsData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test('useCurrentPeriod hook should call api.payments.getCurrentPeriod', async () => {
    // Mock implementation
    const mockPeriodData = { 
      today: '2025-03-26',
      current_year: 2025,
      current_month: 3,
      current_month_for_billing: 2,
      current_month_year_for_billing: 2025,
      current_quarter_for_billing: 1,
      current_quarter_year_for_billing: 2025,
      current_monthly_key: 202502,
      current_quarterly_key: 20251
    };
    
    (api.payments.getCurrentPeriod as jest.Mock).mockResolvedValue(mockPeriodData);

    // Render the hook
    const { result } = renderHook(() => useCurrentPeriod());

    // Execute the getCurrentPeriod function
    await act(async () => {
      await result.current.getCurrentPeriod();
    });

    // Check that the API was called
    expect(api.payments.getCurrentPeriod).toHaveBeenCalled();
    
    // Check that the data was set correctly
    expect(result.current.currentPeriod).toEqual(mockPeriodData);
  });
});