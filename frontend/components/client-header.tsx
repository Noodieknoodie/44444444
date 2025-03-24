"use client";

import { formatDate, formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface ClientData {
  display_name: string;
  client_since: string;
  participants?: number;
  contract_number?: string;
  provider_name: string;
  payment_schedule: 'monthly' | 'quarterly';
  fee_type: 'percentage' | 'flat' | 'fixed';
  percent_rate?: number;
  flat_rate?: number;
}

interface ClientHeaderProps {
  selectedClient: string;
  currentClient: ClientData | null;
}

export function ClientHeader({ selectedClient, currentClient }: ClientHeaderProps) {
  if (!currentClient) {
    return (
      <div className="border-b bg-white p-4">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="animate-pulse h-4 w-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const feeDescription = currentClient.fee_type === "percentage"
    ? `${formatPercent(currentClient.percent_rate)} of Assets`
    : `${formatCurrency(currentClient.flat_rate)} Fixed Fee`;

  // Calculate period rate for percentage clients
  const periodRate = currentClient.fee_type === "percentage" && currentClient.percent_rate
    ? currentClient.payment_schedule === "monthly"
      ? currentClient.percent_rate
      : currentClient.percent_rate * 3
    : null;

  return (
    <div className="border-b bg-white p-4">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentClient.display_name}</h1>
          <p className="text-gray-500">
            Client Since: {formatDate(currentClient.client_since)}
            {currentClient.participants && ` • ${currentClient.participants} Participants`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm">
            <span className="font-semibold">Contract #:</span> {currentClient.contract_number || "N/A"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Provider:</span> {currentClient.provider_name}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Payment Schedule:</span> {currentClient.payment_schedule === "monthly" ? "Monthly" : "Quarterly"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Fee Structure:</span> {feeDescription}
            {periodRate && ` (${formatPercent(periodRate)} per ${currentClient.payment_schedule === "monthly" ? "month" : "quarter"})`}
          </div>
        </div>
      </div>
    </div>
  );
}