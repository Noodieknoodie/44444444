# frontend/src/app/api.ts

// API client for interacting with the backend

const API_BASE_URL = 'http://localhost:8000';

// Response types that match backend models
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

// Client types
export interface Client {
  client_id: number;
  display_name: string;
  full_name?: string;
  ima_signed_date?: string;
  valid_from?: string;
  valid_to?: string;
}

export interface ClientFirstPayment {
  client_id: number;
  display_name: string;
  first_payment_id: number;
  first_payment_date: string;
  first_payment_amount: number;
  first_payment_method?: string;
  first_payment_assets?: number;
  first_payment_period_key: number;
  first_payment_period: string;
}

export interface ClientLastPayment {
  client_id: number;
  display_name: string;
  last_payment_id: number;
  last_payment_date: string;
  last_payment_amount: number;
  last_payment_method?: string;
  last_payment_assets?: number;
  last_payment_period_key: number;
  last_payment_period: string;
  days_since_last_payment: number;
}

// Contract types
export interface Contract {
  contract_id: number;
  client_id: number;
  contract_number?: string;
  provider_id?: number;
  fee_type?: string;
  percent_rate?: number;
  flat_rate?: number;
  payment_schedule: string;
  num_people?: number;
  valid_from?: string;
  valid_to?: string;
  is_active: number;
}

export interface MissingPaymentPeriod {
  client_id: number;
  payment_schedule: string;
  period_key: number;
  period_label: string;
  status: string;
}

// Payment types
export interface Payment {
  payment_id: number;
  contract_id: number;
  client_id: number;
  received_date: string;
  total_assets?: number;
  actual_fee: number;
  method?: string;
  notes?: string;
  start_period_monthly?: string;
  start_period_quarterly?: string;
  period_key_monthly?: number;
  period_key_quarterly?: number;
  is_split_payment: number;
  display_name?: string;
}

export interface SplitPaymentDistribution {
  payment_id: number;
  client_id: number;
  client_name: string;
  received_date: string;
  total_payment_amount: number;
  is_split_payment: number;
  total_periods_covered: number;
  period_key: number;
  period_label: string;
  payment_schedule: string;
  distributed_amount: number;
}

export interface CurrentPeriod {
  today: string;
  current_year: number;
  current_month: number;
  current_month_for_billing: number;
  current_month_year_for_billing: number;
  current_quarter_for_billing: number;
  current_quarter_year_for_billing: number;
  current_monthly_key: number;
  current_quarterly_key: number;
}

export interface PaymentStatus {
  client_id: number;
  payment_schedule: string;
  period_key: number;
  period_label: string;
  status: string;
  display_name?: string;
}

// Contact types
export interface Contact {
  contact_id: number;
  client_id: number;
  contact_type: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  fax?: string;
  physical_address?: string;
  mailing_address?: string;
  valid_from?: string;
  valid_to?: string;
}
export interface Provider {
  provider_id: number;
  provider_name: string;
  valid_from?: string;
  valid_to?: string;
}

// Common fetch function with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Client API endpoints
export const clientsApi = {
  getClients: (params?: { client_id?: number; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<Client>>(`/api/clients${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  getClientById: (clientId: number) => 
    fetchApi<PaginatedResponse<Client>>(`/api/clients?client_id=${clientId}`),
  
  createClient: (client: Omit<Client, 'client_id' | 'valid_from' | 'valid_to'>) => 
    fetchApi<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    }),
  
  updateClient: (clientId: number, client: Partial<Omit<Client, 'client_id' | 'valid_from' | 'valid_to'>>) => 
    fetchApi<Client>(`/api/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    }),
  
  deleteClient: (clientId: number) => 
    fetchApi<Client>(`/api/clients/${clientId}`, {
      method: 'DELETE',
    }),
  
  getFirstPayments: (params?: { client_id?: number; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<ClientFirstPayment>>(`/api/clients/first-payments${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  getLastPayments: (params?: { client_id?: number; min_days?: number; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<ClientLastPayment>>(`/api/clients/last-payments${params ? `?${new URLSearchParams(params as any)}` : ''}`),
};

// Contract API endpoints
export const contractsApi = {
  getContracts: (params?: { contract_id?: number; client_id?: number; provider_id?: number; is_active?: number; payment_schedule?: string; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<Contract>>(`/api/contracts${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  getContractById: (contractId: number) => 
    fetchApi<PaginatedResponse<Contract>>(`/api/contracts?contract_id=${contractId}`),
  
  createContract: (contract: Omit<Contract, 'contract_id' | 'valid_from' | 'valid_to'>) => 
    fetchApi<Contract>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(contract),
    }),
  
  updateContract: (contractId: number, contract: Partial<Omit<Contract, 'contract_id' | 'valid_from' | 'valid_to'>>) => 
    fetchApi<Contract>(`/api/contracts/${contractId}`, {
      method: 'PUT', 
      body: JSON.stringify(contract),
    }),
  
  deleteContract: (contractId: number) => 
    fetchApi<Contract>(`/api/contracts/${contractId}`, {
      method: 'DELETE',
    }),
  
  getActiveContracts: (params?: { client_id?: number; payment_schedule?: string; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<Contract>>(`/api/active-contracts${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  getMissingPeriods: (params?: { client_id?: number; payment_schedule?: string; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<MissingPaymentPeriod>>(`/api/missing-periods${params ? `?${new URLSearchParams(params as any)}` : ''}`)
};

// Payment API endpoints
export const paymentsApi = {
  getPayments: (params?: { client_id?: number; is_split?: boolean; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<Payment>>(`/api/payments${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  createPayment: (payment: {
    contract_id: number;
    client_id: number;
    received_date?: string;
    total_assets?: number;
    actual_fee?: number;
    method?: string;
    notes?: string;
    applied_start_month?: number;
    applied_start_month_year?: number;
    applied_end_month?: number;
    applied_end_month_year?: number;
    applied_start_quarter?: number;
    applied_start_quarter_year?: number;
    applied_end_quarter?: number;
    applied_end_quarter_year?: number;
  }) => 
    fetchApi<Payment>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    }),
  
  updatePayment: (paymentId: number, payment: Partial<{
    contract_id?: number;
    received_date?: string;
    total_assets?: number;
    actual_fee?: number;
    method?: string;
    notes?: string;
    applied_start_month?: number;
    applied_start_month_year?: number;
    applied_end_month?: number;
    applied_end_month_year?: number;
    applied_start_quarter?: number;
    applied_start_quarter_year?: number;
    applied_end_quarter?: number;
    applied_end_quarter_year?: number;
  }>) => 
    fetchApi<Payment>(`/api/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(payment),
    }),
  
  deletePayment: (paymentId: number) => 
    fetchApi<Payment>(`/api/payments/${paymentId}`, {
      method: 'DELETE',
    }),
  
  getSplitPayments: (params?: { payment_id?: number; client_id?: number; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<SplitPaymentDistribution>>(`/api/split-payments${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  getPaymentDistributions: (paymentId: number) => 
    fetchApi<PaginatedResponse<SplitPaymentDistribution>>(`/api/payments/${paymentId}/distributions`),
  
  getCurrentPeriod: () => 
    fetchApi<CurrentPeriod>('/api/current-period'),
  
  getPaymentStatus: (params?: { client_id?: number; status?: string; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<PaymentStatus>>(`/api/payment-status${params ? `?${new URLSearchParams(params as any)}` : ''}`)
};

// Provider API endpoints
export const providersApi = {
  getProviders: (params?: { provider_id?: number; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<Provider>>(`/api/providers${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  getProviderById: (providerId: number) => 
    fetchApi<PaginatedResponse<Provider>>(`/api/providers?provider_id=${providerId}`),
  
  createProvider: (provider: Omit<Provider, 'provider_id' | 'valid_from' | 'valid_to'>) => 
    fetchApi<Provider>('/api/providers', {
      method: 'POST',
      body: JSON.stringify(provider),
    }),
  
  updateProvider: (providerId: number, provider: Partial<Omit<Provider, 'provider_id' | 'valid_from' | 'valid_to'>>) => 
    fetchApi<Provider>(`/api/providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify(provider),
    }),
  
  deleteProvider: (providerId: number) => 
    fetchApi<Provider>(`/api/providers/${providerId}`, {
      method: 'DELETE',
    })
};

// Contact API endpoints
export const contactsApi = {
  getContacts: (params?: { contact_id?: number; client_id?: number; contact_type?: string; limit?: number; offset?: number }) => 
    fetchApi<PaginatedResponse<Contact>>(`/api/contacts${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  
  createContact: (contact: Omit<Contact, 'contact_id' | 'valid_from' | 'valid_to'>) => 
    fetchApi<Contact>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
  
  updateContact: (contactId: number, contact: Partial<Omit<Contact, 'contact_id' | 'valid_from' | 'valid_to'>>) => 
    fetchApi<Contact>(`/api/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    }),
  
  deleteContact: (contactId: number) => 
    fetchApi<Contact>(`/api/contacts/${contactId}`, {
      method: 'DELETE',
    })
};

// Combined API client
const api = {
  clients: clientsApi,
  contracts: contractsApi,
  payments: paymentsApi,
  providers: providersApi,
  contacts: contactsApi
};

export default api;
