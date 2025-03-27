# frontned/src/app/hooks/useApi.ts

import { useCallback, useState } from 'react';
import api from '../api';

// Generic hook for API operations with loading, error, and data state
export function useApiOperation<T, P extends any[]>(
  operationFn: (...args: P) => Promise<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await operationFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [operationFn]
  );

  return {
    execute,
    isLoading,
    error,
    data,
    reset: useCallback(() => {
      setData(null);
      setError(null);
    }, []),
  };
}

// Pre-built hooks for common API operations
export function useClients() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.clients.getClients
  );
  
  return {
    getClients: execute,
    isLoading,
    error,
    clients: data,
    reset,
  };
}

// Helper to get client's payment history for AUM tracking
export function useClientPaymentHistory(clientId?: number) {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    (params = {}) => api.payments.getPayments({ client_id: clientId, ...params })
  );
  
  return {
    getPaymentHistory: execute,
    isLoading,
    error,
    paymentHistory: data,
    reset,
  };
}

export function useClientLastPayments() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.clients.getLastPayments
  );
  
  return {
    getLastPayments: execute,
    isLoading,
    error,
    lastPayments: data,
    reset,
  };
}

export function usePaymentStatus() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.getPaymentStatus
  );
  
  return {
    getPaymentStatus: execute,
    isLoading,
    error,
    paymentStatus: data,
    reset,
  };
}

export function useCurrentPeriod() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.getCurrentPeriod
  );
  
  return {
    getCurrentPeriod: execute,
    isLoading,
    error,
    currentPeriod: data,
    reset,
  };
}

export function useMissingPeriods() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.contracts.getMissingPeriods
  );
  
  return {
    getMissingPeriods: execute,
    isLoading,
    error,
    missingPeriods: data,
    reset,
  };
}

export function usePayments() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.getPayments
  );
  
  return {
    getPayments: execute,
    isLoading,
    error,
    payments: data,
    reset,
  };
}

export function useCreatePayment() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.createPayment
  );
  
  return {
    createPayment: execute,
    isLoading,
    error,
    createdPayment: data,
    reset,
  };
}

export function useUpdatePayment() {
  const { execute: executeUpdate, isLoading, error, data, reset } = useApiOperation(
    (paymentId: number, paymentData: Parameters<typeof api.payments.updatePayment>[1]) => 
      api.payments.updatePayment(paymentId, paymentData)
  );
  
  return {
    updatePayment: executeUpdate,
    isLoading,
    error,
    updatedPayment: data,
    reset,
  };
}

export function useDeletePayment() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.deletePayment
  );
  
  return {
    deletePayment: execute,
    isLoading,
    error,
    deletedPayment: data,
    reset,
  };
}

export function useContracts() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.contracts.getContracts
  );
  
  return {
    getContracts: execute,
    isLoading,
    error,
    contracts: data,
    reset,
  };
}

export function useActiveContracts() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.contracts.getActiveContracts
  );
  
  return {
    getActiveContracts: execute,
    isLoading,
    error,
    activeContracts: data,
    reset,
  };
}

export function useProviders() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.providers.getProviders
  );
  
  return {
    getProviders: execute,
    isLoading,
    error,
    providers: data,
    reset,
  };
}

export function useContacts() {
  const { execute: getContactsExecute, isLoading: getLoading, error: getError, data: contactsData, reset: resetGet } = useApiOperation(
    api.contacts.getContacts
  );
  
  const { execute: createContactExecute, isLoading: createLoading, error: createError, data: createdContact, reset: resetCreate } = useApiOperation(
    api.contacts.createContact
  );
  
  const { execute: updateContactExecute, isLoading: updateLoading, error: updateError, data: updatedContact, reset: resetUpdate } = useApiOperation(
    (contactId: number, data: any) => api.contacts.updateContact(contactId, data)
  );
  
  const { execute: deleteContactExecute, isLoading: deleteLoading, error: deleteError, data: deletedContact, reset: resetDelete } = useApiOperation(
    api.contacts.deleteContact
  );
  
  return {
    getContacts: getContactsExecute,
    createContact: createContactExecute,
    updateContact: updateContactExecute,
    deleteContact: deleteContactExecute,
    contacts: contactsData,
    createdContact,
    updatedContact,
    deletedContact,
    isLoading: getLoading || createLoading || updateLoading || deleteLoading,
    error: getError || createError || updateError || deleteError,
    reset: () => {
      resetGet();
      resetCreate();
      resetUpdate();
      resetDelete();
    }
  };
}

export function useSplitPayments() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.getSplitPayments
  );
  
  return {
    getSplitPayments: execute,
    isLoading,
    error,
    splitPayments: data,
    reset,
  };
}

export function usePaymentDistributions() {
  const { execute, isLoading, error, data, reset } = useApiOperation(
    api.payments.getPaymentDistributions
  );
  
  return {
    getDistributions: execute,
    isLoading,
    error,
    distributions: data,
    reset,
  };
}
