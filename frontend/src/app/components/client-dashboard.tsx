"use client"

import { useState, useEffect } from "react"
import { ClientSnapshot } from "@/components/client-snapshot"
import { PaymentForm } from "@/components/payment-form"
import { PaymentHistory } from "@/components/payment-history"
import { AttachmentViewer } from "@/components/attachment-viewer"
import { cn } from "@/lib/utils"

import { useClientPaymentHistory } from "@/hooks/useApi" // real hook
import type { Payment } from "@/hooks/useApi"

interface ClientDashboardProps {
  clientId: number
  attachmentUrl: string | null
  onViewAttachment: (url: string) => void
  onCloseAttachment: () => void
  sidebarOpen: boolean
}

/**
 * A pure "dashboard" style approach:
 * - fetch the client's payments
 * - show snapshot
 * - show PaymentForm
 * - show PaymentHistory
 * - optionally show attachment
 */
export function ClientDashboard({
  clientId,
  attachmentUrl,
  onViewAttachment,
  onCloseAttachment,
  sidebarOpen,
}: ClientDashboardProps) {
  const { getPaymentHistory, paymentHistory, isLoading, error } = useClientPaymentHistory(clientId)
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (clientId) {
      getPaymentHistory().catch(err => {
        console.error("Failed to fetch payment history:", err)
      })
    }
  }, [clientId, getPaymentHistory])

  useEffect(() => {
    if (paymentHistory?.items) {
      setPayments(paymentHistory.items)
    }
  }, [paymentHistory])

  // These are local add/edit/delete placeholders. In real usage,
  // you'd call your createPayment/updatePayment/deletePayment hooks.
  const handleAddPayment = (payment: Payment) => {
    setPayments(prev => [payment, ...prev])
  }

  const handleEditPayment = (updated: Payment) => {
    setPayments(prev => prev.map((p) => (p.payment_id === updated.payment_id ? updated : p)))
  }

  const handleDeletePayment = (paymentId: number) => {
    setPayments(prev => prev.filter((p) => p.payment_id !== paymentId))
  }

  if (isLoading) {
    return <div className="p-4">Loading client dashboard...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading dashboard: {error.message}</div>
  }

  // The wireframe used a "client" object with name, etc. We’ll rely on <ClientSnapshot>
  // to show that info. If you want the real data, you’d fetch the client details. This is
  // just a placeholder. We'll pass clientId to <ClientSnapshot> as well for a real fetch.

  return (
    <div className={cn("flex h-full transition-all duration-300", attachmentUrl ? "flex-row" : "flex-col")}>
      <div className={cn("h-full overflow-auto transition-all duration-300", attachmentUrl ? "w-1/2" : "w-full")}>
        <div className={cn("p-8 space-y-8", !sidebarOpen ? "max-w-7xl mx-auto" : "")}>
          {/* A snapshot could also fetch the real client details */}
          <ClientSnapshot clientId={clientId} />

          <PaymentForm
            clientId={clientId}
            onAddPayment={handleAddPayment}
            className={attachmentUrl ? "hidden md:block" : ""}
          />

          <PaymentHistory
            payments={payments}
            onViewAttachment={onViewAttachment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            condensed={!!attachmentUrl}
          />
        </div>
      </div>

      {attachmentUrl && <AttachmentViewer url={attachmentUrl} onClose={onCloseAttachment} />}
    </div>
  )
}
