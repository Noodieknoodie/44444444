'use client';

import { useState, useEffect } from 'react';
import { useClients, useCurrentPeriod, usePaymentStatus, useClientLastPayments } from '../hooks/useApi';
import { formatCurrency, formatDate, getStatusClass } from '../utils/formatters';
import { Client, ClientLastPayment } from '../api';
import { DataTable, Column } from '../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Data fetching hooks
  const { getClients, clients, isLoading: clientsLoading, error: clientsError } = useClients();
  const { getLastPayments, lastPayments, isLoading: lastPaymentsLoading } = useClientLastPayments();
  const { getPaymentStatus, paymentStatus, isLoading: statusLoading } = usePaymentStatus();

  // Fetch data on component mount
  useEffect(() => {
    getClients({ limit: pageSize, offset: (page - 1) * pageSize });
    getLastPayments({ limit: 100 });
    getPaymentStatus({ limit: 100 });
  }, [page]);

  // Define columns for client table
  const clientColumns: Column<Client>[] = [
    {
      header: 'Client Name',
      accessorKey: 'display_name',
      className: 'font-medium',
      cell: (client) => (
        <Link href={`/clients/${client.client_id}`} className="text-slate-900 hover:text-slate-600">
          {client.display_name}
        </Link>
      )
    },
    {
      header: 'Full Name',
      accessorKey: 'full_name',
      cell: (client) => client.full_name || 'N/A'
    },
    {
      header: 'IMA Signed',
      accessorKey: 'ima_signed_date',
      cell: (client) => formatDate(client.ima_signed_date)
    },
    {
      header: 'Last Payment',
      accessorKey: (client) => {
        const lastPayment = lastPayments?.items.find(p => p.client_id === client.client_id);
        
        if (lastPayment) {
          return (
            <div>
              <div>{formatDate(lastPayment.last_payment_date)}</div>
              <div className="text-xs text-slate-500">{formatCurrency(lastPayment.last_payment_amount)}</div>
            </div>
          );
        }
        
        return 'No payments';
      }
    },
    {
      header: 'Days Since',
      accessorKey: (client) => {
        const lastPayment = lastPayments?.items.find(p => p.client_id === client.client_id);
        
        if (lastPayment) {
          return (
            <div className={lastPayment.days_since_last_payment > 45 ? 'text-amber-600 font-medium' : ''}>
              {Math.round(lastPayment.days_since_last_payment)} days
            </div>
          );
        }
        
        return 'N/A';
      }
    },
    {
      header: 'Status',
      accessorKey: (client) => {
        const status = paymentStatus?.items.find(s => s.client_id === client.client_id);
        
        return status ? (
          <span className={getStatusClass(status.status)}>
            {status.status}
          </span>
        ) : 'N/A';
      }
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        
        <Button className="bg-slate-800 hover:bg-slate-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={clientColumns}
            data={clients?.items || []}
            isLoading={clientsLoading || lastPaymentsLoading || statusLoading}
            error={clientsError}
            pageSize={pageSize}
            totalItems={clients?.total || 0}
            currentPage={page}
            onPageChange={setPage}
            emptyMessage="No clients found."
            onRowClick={(client) => {
              window.location.href = `/clients/${client.client_id}`;
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
