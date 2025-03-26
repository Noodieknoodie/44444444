'use client';

import { useState, useEffect } from 'react';
import { useClients, useCurrentPeriod, usePaymentStatus, useMissingPeriods } from '../hooks/useApi';
import { formatCurrency, formatDate, getStatusClass } from '../utils/formatters';
import { Client, PaymentStatus, MissingPaymentPeriod } from '../api';
import { DataTable, Column } from '../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Data fetching hooks
  const { getClients, clients, isLoading: clientsLoading, error: clientsError } = useClients();
  const { getCurrentPeriod, currentPeriod, isLoading: periodLoading } = useCurrentPeriod();
  const { getPaymentStatus, paymentStatus, isLoading: statusLoading } = usePaymentStatus();
  const { getMissingPeriods, missingPeriods, isLoading: missingLoading } = useMissingPeriods();

  // Fetch data on component mount
  useEffect(() => {
    getClients({ limit: pageSize, offset: (page - 1) * pageSize });
    getCurrentPeriod();
    getPaymentStatus({ limit: 100 }); // Get all statuses
    getMissingPeriods({ limit: 100 }); // Get all missing periods
  }, [page]);

  // Group missing periods by client for notification display
  const missingPeriodsByClient = missingPeriods?.items.reduce((acc, period) => {
    if (!acc[period.client_id]) {
      acc[period.client_id] = [];
    }
    acc[period.client_id].push(period);
    return acc;
  }, {} as Record<number, MissingPaymentPeriod[]>) || {};

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
      header: 'Payment Status',
      accessorKey: (client) => {
        const status = paymentStatus?.items.find(s => s.client_id === client.client_id);
        const hasMissingPeriods = missingPeriodsByClient[client.client_id]?.length > 0;
        
        return (
          <div className="flex items-center gap-2">
            {status ? (
              <span className={getStatusClass(status.status)}>
                {status.status}
              </span>
            ) : 'N/A'}
            
            {hasMissingPeriods && (
              <div className="flex items-center text-amber-500" title="Missing payments">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">{missingPeriodsByClient[client.client_id].length}</span>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  // Define columns for payment status table
  const statusColumns: Column<PaymentStatus>[] = [
    {
      header: 'Client',
      accessorKey: 'display_name',
      className: 'font-medium',
      cell: (status) => (
        <Link href={`/clients/${status.client_id}`} className="text-slate-900 hover:text-slate-600">
          {status.display_name || `Client #${status.client_id}`}
        </Link>
      )
    },
    {
      header: 'Period',
      accessorKey: 'period_label'
    },
    {
      header: 'Schedule',
      accessorKey: 'payment_schedule',
      cell: (status) => status.payment_schedule === 'monthly' ? 'Monthly' : 'Quarterly'
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (status) => (
        <span className={getStatusClass(status.status)}>
          {status.status}
        </span>
      )
    }
  ];
  
  // Define columns for missing payments table
  const missingColumns: Column<MissingPaymentPeriod>[] = [
    {
      header: 'Client',
      accessorKey: (period) => {
        const client = clients?.items.find(c => c.client_id === period.client_id);
        return client?.display_name || `Client #${period.client_id}`;
      },
      cell: (period) => (
        <Link href={`/clients/${period.client_id}`} className="text-slate-900 hover:text-slate-600">
          {clients?.items.find(c => c.client_id === period.client_id)?.display_name || `Client #${period.client_id}`}
        </Link>
      )
    },
    {
      header: 'Period',
      accessorKey: 'period_label'
    },
    {
      header: 'Schedule',
      accessorKey: 'payment_schedule',
      cell: (period) => period.payment_schedule === 'monthly' ? 'Monthly' : 'Quarterly'
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: () => (
        <span className="text-amber-600 font-medium">Missing</span>
      )
    },
    {
      header: '',
      accessorKey: (period) => (
        <Link 
          href={`/clients/${period.client_id}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Record Payment
        </Link>
      )
    }
  ];

  // Calculate dashboard summary stats
  const totalClients = clients?.total || 0;
  const paidClients = paymentStatus?.items.filter(s => s.status === 'Paid').length || 0;
  const unpaidClients = paymentStatus?.items.filter(s => s.status === 'Unpaid').length || 0;
  const paymentRate = totalClients > 0 ? Math.round((paidClients / totalClients) * 100) : 0;
  const clientsWithMissingPayments = Object.keys(missingPeriodsByClient).length;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* Current Period Info */}
      {currentPeriod && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Period (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentPeriod.current_month_for_billing}/{currentPeriod.current_month_year_for_billing}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly billing key: {currentPeriod.current_monthly_key}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Period (Quarterly)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Q{currentPeriod.current_quarter_for_billing} {currentPeriod.current_quarter_year_for_billing}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Quarterly billing key: {currentPeriod.current_quarterly_key}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payment Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paidClients} paid / {unpaidClients} outstanding
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missing Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{clientsWithMissingPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clients with missing payment periods
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Tabs for different views */}
      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="payment-status">Payment Status</TabsTrigger>
          <TabsTrigger value="missing-payments">Missing Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client List</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={clientColumns}
                data={clients?.items || []}
                isLoading={clientsLoading}
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
        </TabsContent>
        
        <TabsContent value="payment-status">
          <Card>
            <CardHeader>
              <CardTitle>Current Period Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={statusColumns}
                data={paymentStatus?.items || []}
                isLoading={statusLoading}
                pageSize={pageSize}
                totalItems={paymentStatus?.total || 0}
                currentPage={page}
                onPageChange={setPage}
                emptyMessage="No payment status information available."
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="missing-payments">
          <Card>
            <CardHeader>
              <CardTitle>Missing Payment Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={missingColumns}
                data={missingPeriods?.items || []}
                isLoading={missingLoading}
                pageSize={pageSize}
                totalItems={missingPeriods?.total || 0}
                currentPage={page}
                onPageChange={setPage}
                emptyMessage="No missing payment periods found."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}