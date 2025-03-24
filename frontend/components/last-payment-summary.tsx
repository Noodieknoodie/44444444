"use client";

import { formatDate, formatCurrency, formatNumber, calculateVariance } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, CheckCircle } from "lucide-react";

interface LastPayment {
  last_payment_date: string;
  last_payment_amount: number;
  last_payment_assets?: number;
  last_payment_type?: string;
  last_payment_period: string;
}

interface ClientData {
  client_id: string;
  fee_type: 'percentage' | 'flat' | 'fixed';
  percent_rate?: number;
  flat_rate?: number;
  last_payment?: LastPayment;
  missing_periods?: string[];
}

interface LastPaymentSummaryProps {
  currentClient: ClientData | null;
}

export function LastPaymentSummary({ currentClient }: LastPaymentSummaryProps) {
  if (!currentClient || !currentClient.last_payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Payment: No Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No payment history available for this client.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { last_payment } = currentClient;

  // Calculate expected fee based on contract and last payment AUM
  let expectedFee = null;
  let variance = null;

  // Only calculate for non-split payments
  if (currentClient.fee_type === "percentage" && last_payment.last_payment_assets) {
    expectedFee = last_payment.last_payment_assets * currentClient.percent_rate!;
    variance = calculateVariance(last_payment.last_payment_amount, expectedFee);
  } else if (currentClient.fee_type === "flat" || currentClient.fee_type === "fixed") {
    expectedFee = currentClient.flat_rate!;
    variance = calculateVariance(last_payment.last_payment_amount, expectedFee);
  }

  // Get the status color and icon for variance
  let statusColor = "text-gray-500";
  let StatusIcon = CheckCircle;

  if (variance && variance.classification) {
    if (variance.classification === "Within Target") {
      statusColor = "text-green-500";
      StatusIcon = CheckCircle;
    } else if (variance.classification === "Overpaid") {
      statusColor = "text-amber-500";
      StatusIcon = ArrowUp;
    } else if (variance.classification === "Underpaid") {
      statusColor = "text-red-500";
      StatusIcon = ArrowDown;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Payment: {formatDate(last_payment.last_payment_date)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Applied Period</p>
              <p className="text-2xl font-bold">{last_payment.last_payment_period}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Assets Under Management</p>
              <p className="text-2xl font-bold">{formatCurrency(last_payment.last_payment_assets)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Expected Fee</p>
              <p className="text-2xl font-bold">{formatCurrency(expectedFee, { fallback: "N/A" })}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Amount Received</p>
              <p className="text-2xl font-bold">{formatCurrency(last_payment.last_payment_amount)}</p>
            </div>
          </div>

          {variance && variance.amount !== null && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                <div>
                  <p className={`text-base font-bold ${statusColor}`}>
                    {variance.classification} -
                    {variance.amount > 0 ? " +" : " "}
                    {formatCurrency(variance.amount)}
                    {" ("}
                    {variance.percent > 0 ? "+" : ""}
                    {variance.percent.toFixed(2)}%
                    {")"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentClient.missing_periods && currentClient.missing_periods.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium">Missing Payments</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentClient.missing_periods.map((period: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    {period}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}