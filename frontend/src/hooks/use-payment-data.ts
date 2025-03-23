"use client"

import { useState, useEffect } from 'react';

export interface Payment {
  payment_id: string;
  received_date: string;
  period_label: string;
  total_assets: number;
  expected_fee: number;
  actual_fee: number;
  variance: number;
  is_split: boolean;
  method: string;
  notes: string | null;
  splitPayments?: {
    period: string;
    aum: number;
    expected: number;
    received: number;
  }[];
}

interface PaymentResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: Payment[];
}

export function usePaymentData(clientId: string | null, page = 1, pageSize = 10) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });

  useEffect(() => {
    if (!clientId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    async function fetchPayments() {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}/payments?page=${page}&pageSize=${pageSize}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching payments: ${response.status}`);
        }
        
        const data: PaymentResponse = await response.json();
        
        // Map API response to our Payment interface
        const mappedPayments = data.data.map(payment => ({
          ...payment,
          // Format date for display
          received_date: new Date(payment.received_date).toISOString().split('T')[0],
          // Add any additional derived fields needed by UI
          hasAttachment: false, // This will be updated when document functionality is added
          status: payment.variance === 0 
            ? 'on-time' 
            : payment.variance > 0 
              ? 'overpaid' 
              : 'partial'
        }));
        
        setPayments(mappedPayments);
        setPagination({
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
          totalPages: data.totalPages
        });
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch payments for client ${clientId}:`, err);
        setError('Failed to load payment history. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [clientId, page, pageSize]);

  // Add a payment
  const addPayment = async (paymentData: any) => {
    if (!clientId) return null;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error(`Error adding payment: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Refresh payments list
      const paymentsResponse = await fetch(`/api/clients/${clientId}/payments?page=${page}&pageSize=${pageSize}`);
      const data: PaymentResponse = await paymentsResponse.json();
      
      setPayments(data.data.map(payment => ({
        ...payment,
        received_date: new Date(payment.received_date).toISOString().split('T')[0],
        hasAttachment: false,
        status: payment.variance === 0 
          ? 'on-time' 
          : payment.variance > 0 
            ? 'overpaid' 
            : 'partial'
      })));
      
      setPagination({
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages
      });
      
      return result;
    } catch (err) {
      console.error('Failed to add payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    payments, 
    pagination, 
    loading, 
    error,
    addPayment
  };
}
