"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Eye, Pencil, Trash, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaymentData } from "@/hooks/use-payment-data";
import { formatDate, formatCurrency, calculateVariance } from "@/lib/utils";
import { paymentsApi } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Payment {
  payment_id: string;
  received_date: string;
  period_label: string;
  total_assets?: number;
  actual_fee: number;
  periods_covered: number;
  has_document: boolean;
  is_split: boolean;
  split_details?: SplitDetail[];
}

interface SplitDetail {
  period_label: string;
  distributed_amount: number;
}

interface ClientData {
  client_id: string | number;
  fee_type: 'percentage' | 'flat' | 'fixed';
  percent_rate?: number;
  flat_rate?: number;
}

interface PaymentHistoryProps {
  currentClient: ClientData | null;
  togglePdfViewer: () => void;
}

export function PaymentHistory({ currentClient, togglePdfViewer }: PaymentHistoryProps) {
  const clientId = currentClient?.client_id ? Number(currentClient.client_id) : null;
  const { payments, loading, error } = usePaymentData(clientId);
  const [expandedPayments, setExpandedPayments] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toggle expanded state for split payments
  const togglePaymentExpanded = (paymentId: string) => {
    setExpandedPayments((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  // Delete payment handler
  const handleDeletePayment = async () => {
    if (!deleteDialog.paymentId) return;

    try {
      await paymentsApi.delete(deleteDialog.paymentId);
      setRefreshTrigger(prev => prev + 1); // Force refresh
    } catch (err) {
      console.error("Error deleting payment:", err);
    } finally {
      setDeleteDialog({ open: false, paymentId: null });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading payment history...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Error loading payment history: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payment history available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-2">Date Received</th>
                <th className="text-left px-4 py-2">Period</th>
                <th className="text-right px-4 py-2">AUM</th>
                <th className="text-right px-4 py-2">Expected Fee</th>
                <th className="text-right px-4 py-2">Actual Fee</th>
                <th className="text-right px-4 py-2">Variance</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: Payment) => {
                const isSplit = payment.is_split;
                const isExpanded = expandedPayments.includes(payment.payment_id);
                let expectedFee = null;
                let variance = null;

                if (!isSplit && currentClient) {
                  if (currentClient.fee_type === "percentage" && payment.total_assets) {
                    expectedFee = payment.total_assets * (currentClient.percent_rate || 0);
                    variance = calculateVariance(payment.actual_fee, expectedFee);
                  } else if (currentClient.fee_type === "flat" || currentClient.fee_type === "fixed") {
                    expectedFee = currentClient.flat_rate || 0;
                    variance = calculateVariance(payment.actual_fee, expectedFee);
                  }
                }

                return (
                  <React.Fragment key={payment.payment_id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {isSplit ? (
                          <button
                            className="flex items-center text-left text-blue-600 hover:text-blue-800"
                            onClick={() => togglePaymentExpanded(payment.payment_id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 mr-1" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-1" />
                            )}
                            {formatDate(payment.received_date)}
                          </button>
                        ) : (
                          formatDate(payment.received_date)
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {payment.period_label}
                        {isSplit && ` + ${payment.periods_covered - 1} more`}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(payment.total_assets)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isSplit ? "—" : formatCurrency(expectedFee)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(payment.actual_fee)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isSplit ? (
                          "—"
                        ) : variance && variance.amount !== null ? (
                          <span
                            className={
                              variance.classification === "Within Target"
                                ? "text-green-600"
                                : variance.amount > 0
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {variance.amount > 0 ? "+" : ""}
                            {formatCurrency(variance.amount)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          {payment.has_document && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={togglePdfViewer}
                              title="View Document"
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { }}
                            title="Edit Payment"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, paymentId: payment.payment_id })}
                            title="Delete Payment"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Split payment details */}
                    {isSplit && isExpanded && payment.split_details && (
                      <>
                        {payment.split_details.map((detail: SplitDetail, index: number) => (
                          <tr key={`${payment.payment_id}-${index}`} className="bg-gray-50 border-b text-sm">
                            <td className="px-4 py-2 pl-8"></td>
                            <td className="px-4 py-2">{detail.period_label}</td>
                            <td className="px-4 py-2 text-right">
                              {formatCurrency(payment.total_assets)}
                            </td>
                            <td className="px-4 py-2 text-right">—</td>
                            <td className="px-4 py-2 text-right">
                              {formatCurrency(detail.distributed_amount)}
                            </td>
                            <td className="px-4 py-2 text-right">—</td>
                            <td className="px-4 py-2"></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open, paymentId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}