"use client"

import { useEffect, useState } from "react"

// Updated data types to match our API
export interface Client {
  client_id: number;
  display_name: string;
  full_name: string;
  ima_signed_date: string;
  payment_schedule: string;
  fee_type: string;
  percent_rate: number | null;
  flat_rate: number | null;
  num_people: number;
  provider_name: string;
  current_aum: number;
  currentStatus: {
    status: string;
    period_label?: string;
  };
  missingPeriods: string[];
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  clients: number;
  totalAum: number;
}

export function useClientData(selectedClientId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState({
    monthly: "",
    quarterly: ""
  });

  // Fetch list of clients
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error(`Error fetching clients: ${response.status}`);
        }
        
        const data = await response.json();
        setClients(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  // Fetch current period information
  useEffect(() => {
    async function fetchCurrentPeriod() {
      try {
        const response = await fetch('/api/periods/current');
        
        if (!response.ok) {
          throw new Error(`Error fetching current period: ${response.status}`);
        }
        
        const data = await response.json();
        setCurrentPeriod({
          monthly: data.current_monthly_label,
          quarterly: data.current_quarterly_label
        });
      } catch (err) {
        console.error('Failed to fetch current period:', err);
      }
    }

    fetchCurrentPeriod();
  }, []);

  // Fetch selected client details
  useEffect(() => {
    if (!selectedClientId) {
      setCurrentClient(null);
      return;
    }

    async function fetchClientDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${selectedClientId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching client details: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data to match our Client interface
        const clientData: Client = {
          ...data,
          // Add derived fields that might be needed by UI components
          currentQuarterStatus: data.currentStatus?.status?.toLowerCase() || 'unknown'
        };
        
        setCurrentClient(clientData);
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch client ${selectedClientId}:`, err);
        setError('Failed to load client details. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchClientDetails();
  }, [selectedClientId]);

  // Calculate expected fee based on AUM
  const calculateExpectedFee = (aum: number, client?: Client | null) => {
    if (!client) client = currentClient;
    if (!client) return 0;

    if (client.fee_type === 'percentage' && client.percent_rate) {
      return aum * client.percent_rate;
    } else if (client.fee_type === 'flat' && client.flat_rate) {
      return client.flat_rate;
    }
    return 0;
  };

  return {
    clients,
    currentClient,
    currentPeriod,
    calculateExpectedFee,
    loading,
    error
  };
}
