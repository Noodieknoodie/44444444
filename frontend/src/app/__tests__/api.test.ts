/**
 * @jest-environment jsdom
 */

import api, { Client, Payment } from '../api';
import { enableFetchMocks } from 'jest-fetch-mock';

// Enable fetch mocks
enableFetchMocks();

describe('API Client Tests', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('fetchApi should handle successful responses', async () => {
    // Mock the fetch response
    const mockData = { 
      items: [{ client_id: 1, display_name: 'Test Client' }], 
      total: 1 
    };
    
    fetchMock.mockResponseOnce(JSON.stringify(mockData));

    // Call the clients API
    const result = await api.clients.getClients();

    // Verify fetch was called with the right URL
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/clients',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Verify the result matches the mock data
    expect(result).toEqual(mockData);
  });

  test('fetchApi should handle error responses', async () => {
    // Mock an error response
    fetchMock.mockResponseOnce(JSON.stringify({ detail: 'Not found' }), { status: 404 });

    // Call the API and expect it to throw
    await expect(api.clients.getClientById(999)).rejects.toThrow();
  });

  test('clients API should include query parameters', async () => {
    const mockData = { items: [], total: 0 };
    fetchMock.mockResponseOnce(JSON.stringify(mockData));

    // Call API with parameters
    await api.clients.getClients({ limit: 10, offset: 20 });

    // Verify URL includes query parameters
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/clients?limit=10&offset=20',
      expect.anything()
    );
  });

  test('payments API should send correct body for create', async () => {
    const mockPayment = {
      payment_id: 1,
      client_id: 1,
      contract_id: 1,
      received_date: '2025-03-26',
      actual_fee: 1000,
      method: 'Wire Transfer',
      is_split_payment: 0
    } as Payment;

    fetchMock.mockResponseOnce(JSON.stringify(mockPayment));

    const paymentData = {
      client_id: 1,
      contract_id: 1,
      received_date: '2025-03-26',
      actual_fee: 1000,
      method: 'Wire Transfer'
    };

    // Create a payment
    await api.payments.createPayment(paymentData);

    // Verify method and body
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/payments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(paymentData)
      })
    );
  });

  test('contracts API should send correct parameters for getMissingPeriods', async () => {
    const mockResponse = { items: [], total: 0 };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    // Call API with client_id filter
    await api.contracts.getMissingPeriods({ 
      client_id: 5, 
      payment_schedule: 'monthly' 
    });

    // Verify URL includes correct parameters
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/missing-periods?client_id=5&payment_schedule=monthly',
      expect.anything()
    );
  });
});