'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClientDashboard } from '@/app/components/ClientDashboard';
import { 
  useClients, 
  useContracts, 
  usePayments,
  useSplitPayments,
  useContacts
} from '@/app/hooks/useApi';
import { Client, Contract, Payment, SplitPaymentDistribution, Contact } from '@/app/api';

export default function ClientPage() {
  const { clientId } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [splitDistributions, setSplitDistributions] = useState<SplitPaymentDistribution[]>([]);
  const [clientContacts, setClientContacts] = useState<Contact[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // API hooks
  const { getClients, clients, isLoading: isClientLoading } = useClients();
  const { getContracts, contracts, isLoading: isContractLoading } = useContracts();
  const { getPayments, payments: fetchedPayments, isLoading: isPaymentLoading } = usePayments();
  const { getSplitPayments, splitPayments, isLoading: isSplitLoading } = useSplitPayments();
  const { getContacts, contacts, isLoading: isContactsLoading } = useContacts();
  
  // Fetch client data
  useEffect(() => {
    if (clientId) {
      getClients({ client_id: Number(clientId) });
    }
  }, [clientId]);
  
  // Set client when data is loaded
  useEffect(() => {
    if (clients && clients.items && clients.items.length > 0) {
      setClient(clients.items[0]);
    }
  }, [clients]);
  
  // Fetch contract when client is loaded
  useEffect(() => {
    if (client) {
      getContracts({ client_id: client.client_id, is_active: 1 });
    }
  }, [client]);
  
  // Set contract when loaded
  useEffect(() => {
    if (contracts && contracts.items && contracts.items.length > 0) {
      setContract(contracts.items[0]);
    }
  }, [contracts]);
  
  // Fetch payments, split payment distributions, and contacts
  useEffect(() => {
    if (client) {
      getPayments({ client_id: client.client_id, limit: 100 });
      getSplitPayments({ client_id: client.client_id, limit: 100 });
      getContacts({ client_id: client.client_id, limit: 100 });
    }
  }, [client]);
  
  // Update state when payments are loaded
  useEffect(() => {
    if (fetchedPayments && fetchedPayments.items) {
      setPayments(fetchedPayments.items);
    }
  }, [fetchedPayments]);
  
  // Update state when split payments are loaded
  useEffect(() => {
    if (splitPayments && splitPayments.items) {
      setSplitDistributions(splitPayments.items);
    }
  }, [splitPayments]);
  
  // Update state when contacts are loaded
  useEffect(() => {
    if (contacts && contacts.items) {
      setClientContacts(contacts.items);
    }
  }, [contacts]);
  
  // Handler for adding a new payment
  const handleAddPayment = (payment: Payment) => {
    // In a real implementation, this would call the API to create a payment
    console.log('Add payment:', payment);
  };
  
  // Handler for editing a payment
  const handleEditPayment = (payment: Payment) => {
    // In a real implementation, this would call the API to update a payment
    console.log('Edit payment:', payment);
  };
  
  // Handler for deleting a payment
  const handleDeletePayment = (paymentId: number) => {
    // In a real implementation, this would call the API to delete a payment
    console.log('Delete payment:', paymentId);
  };
  
  if (isClientLoading || isContractLoading || isPaymentLoading || isSplitLoading || isContactsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading client data...</p>
        </div>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Client Not Found</h2>
          <p className="text-slate-600 mb-6">We couldn't find a client with the ID {clientId}.</p>
          <a 
            href="/"
            className="inline-block bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        <ClientDashboard
          client={client}
          contract={contract || undefined}
          payments={payments}
          splitDistributions={splitDistributions}
          contacts={clientContacts}
          onAddPayment={handleAddPayment}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}
