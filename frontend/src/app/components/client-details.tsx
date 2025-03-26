"use client"

import { useEffect, useState } from "react"
import { PaymentForm } from "@/components/payment-form"
import { PaymentHistory } from "@/components/payment-history"
import { MissedPaymentsNotice } from "@/components/missed-payments-notice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, TrendingUp, TrendingDown, CheckCircle } from "lucide-react"
import { ContactPanel } from "@/components/contact-panel"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  useClients,
  useActiveContracts,
  useMissingPeriods,
  useClientPaymentHistory
} from "@/hooks/useApi"
import type {
  Client as DBClient,
  Contract,
  MissingPaymentPeriod,
  Payment,
} from "@/hooks/useApi"

interface ClientDetailsProps {
  clientId: number
  onViewAttachment: (url: string) => void
  condensed?: boolean
}

export function ClientDetails({ clientId, onViewAttachment, condensed = false }: ClientDetailsProps) {
  const { getClientById, isLoading: clientLoading, error: clientError, clients: clientData, reset } = useClients()
  const { getActiveContracts, activeContracts, isLoading: contractsLoading } = useActiveContracts()
  const { getMissingPeriods, missingPeriods, isLoading: missingLoading } = useMissingPeriods()
  const { getPaymentHistory, paymentHistory, isLoading: paymentsLoading } = useClientPaymentHistory(clientId)

  // We'll store a local shape that combines all info to mimic the wireframe
  const [combined, setCombined] = useState<{
    client?: DBClient
    contract?: Contract
    missedPeriods?: MissingPaymentPeriod[]
    payments?: Payment[]
  }>({})

  const [currentPage, setCurrentPage] = useState(1)
  const paymentsPerPage = 10

  // 1) Fetch the client
  useEffect(() => {
    getClientById(clientId, 1, 0).catch(console.error)
    // We only want to load once per change of client
    return () => reset()
  }, [clientId, getClientById, reset])

  // 2) Fetch active contract
  useEffect(() => {
    getActiveContracts({ client_id: clientId }).catch(console.error)
  }, [clientId, getActiveContracts])

  // 3) Missing periods
  useEffect(() => {
    getMissingPeriods({ client_id: clientId }).catch(console.error)
  }, [clientId, getMissingPeriods])

  // 4) Payment history
  useEffect(() => {
    getPaymentHistory().catch(console.error)
  }, [clientId, getPaymentHistory])

  // Once everything is fetched, unify into one shape
  useEffect(() => {
    const c = clientData?.items?.[0]
    const ct = activeContracts?.items?.[0]
    const mp = missingPeriods?.items
    const ph = paymentHistory?.items

    setCombined({
      client: c,
      contract: ct,
      missedPeriods: mp,
      payments: ph,
    })
  }, [clientData, activeContracts, missingPeriods, paymentHistory])

  if (clientLoading || contractsLoading || missingLoading || paymentsLoading) {
    return (
      <div className="p-4">
        <p>Loading client details...</p>
      </div>
    )
  }

  if (clientError) {
    return (
      <div className="p-4 text-red-600">
        <p>Failed to load client: {clientError.message}</p>
      </div>
    )
  }

  const theClient = combined.client
  const theContract = combined.contract
  const thePayments = combined.payments || []
  const theMissed = combined.missedPeriods || []

  // The wireframe references a bunch of fields that your real DB doesn’t store directly.
  // We'll do best-guess placeholders:
  const clientName = theClient?.display_name || "Unnamed"
  const providerName = theContract?.provider_id ? `Provider #${theContract.provider_id}` : "N/A"
  const paymentSchedule = theContract?.payment_schedule || "monthly"
  const isCurrentPeriodPaid = false // You’d figure this out from your v_current_period or your logic
  const complianceStatus = theMissed.length > 0 ? "non-compliant" : "compliant"

  // For contract start, we only have valid_from or ima_signed_date from DB
  const contractStart = theClient?.ima_signed_date || theClient?.valid_from || ""
  const totalPayments = thePayments.length
  const ytdPayments = 0 // You’d do your own logic or you can skip it

  // Last payment info
  // If you want the *actual* last payment date from v_client_payment_last, use that endpoint. For now, we do local:
  const lastPayment = thePayments.slice().sort((a, b) =>
    new Date(b.received_date).getTime() - new Date(a.received_date).getTime()
  )[0]

  // We'll handle local state for adding/editing/deleting payments
  const [payments, setPayments] = useState<Payment[]>(thePayments)

  useEffect(() => {
    setPayments(thePayments)
  }, [thePayments])

  const handleAddPayment = (newPayment: Payment) => {
    setPayments(prev => [newPayment, ...prev])
  }

  const handleEditPayment = (updated: Payment) => {
    setPayments(prev => prev.map((p) => (p.payment_id === updated.payment_id ? updated : p)))
  }

  const handleDeletePayment = (paymentId: number) => {
    setPayments(prev => prev.filter((p) => p.payment_id !== paymentId))
  }

  // Pagination
  const indexOfLastPayment = currentPage * paymentsPerPage
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage
  const currentPayments = payments.slice(indexOfFirstPayment, indexOfLastPayment)
  const totalPages = Math.ceil(payments.length / paymentsPerPage)

  // Helper for variance icons
  function renderVarianceIndicator(actual: number, expected: number) {
    const variance = actual - expected
    if (Math.abs(variance) <= 3) {
      return <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
    }
    if (variance > 0) {
      return <TrendingUp className="h-3.5 w-3.5 text-slate-600" />
    }
    return <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
  }

  function renderVarianceTooltip(actual: number, expected: number) {
    const variance = actual - expected
    const variancePercent = expected ? (variance / expected) * 100 : 0
    if (Math.abs(variance) <= 3) {
      return "Within target range"
    }
    if (variance > 0) {
      return `Overpaid by ${formatCurrency(variance)} (${variancePercent.toFixed(1)}%)`
    }
    return `Underpaid by ${formatCurrency(Math.abs(variance))} (${Math.abs(variancePercent).toFixed(1)}%)`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{clientName}</h1>
            <div className="mt-1 flex items-center gap-2 text-slate-500">
              <span>{providerName}</span>
              <span className="text-slate-300">•</span>
              <span>Contract # {theContract?.contract_id || "N/A"}</span>
              <span className="text-slate-300">•</span>
              <span>Since {formatDate(contractStart)}</span>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Contacts</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Manage Contacts</DialogTitle>
                <DialogDescription>View, edit, or delete contacts for {clientName}.</DialogDescription>
              </DialogHeader>
              <ContactPanel clientId={clientId} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {/* Contract Details Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 w-full bg-slate-600"></div>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-medium text-slate-900">Contract Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Provider</span>
                  <span className="font-medium text-slate-900">{providerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Schedule</span>
                  <span className="font-medium text-slate-900">
                    {paymentSchedule.charAt(0).toUpperCase() + paymentSchedule.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fee Type</span>
                  <span className="font-medium text-slate-900">
                    {theContract?.fee_type || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Annual Rate</span>
                  <span className="font-medium text-slate-900">
                    {/* If it's percent or flat, your real code may do different logic */}
                    {theContract?.percent_rate
                      ? `${theContract.percent_rate}%`
                      : formatCurrency(theContract?.flat_rate || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Period Rate</span>
                  <span className="font-medium text-slate-900">
                    {/* This is just a placeholder example */}
                    {theContract?.percent_rate
                      ? `${(theContract.percent_rate / (paymentSchedule === "monthly" ? 12 : 4)).toFixed(4)}%`
                      : formatCurrency(theContract?.flat_rate || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 w-full bg-slate-600"></div>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-medium text-slate-900">Current Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Period</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">N/A</span>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${isCurrentPeriodPaid ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {isCurrentPeriodPaid ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Compliance Status</span>
                  <span
                    className={`font-medium ${complianceStatus === "compliant" ? "text-slate-900" : "text-amber-600"
                      }`}
                  >
                    {complianceStatus === "compliant" ? "Compliant" : "Non-Compliant"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Missing Periods</span>
                  <span className="font-medium text-slate-900">
                    {theMissed.length > 0 ? (
                      <span className="text-amber-600">{theMissed.length}</span>
                    ) : (
                      "None"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Payments</span>
                  <span className="font-medium text-slate-900">{totalPayments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">YTD Payments</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(ytdPayments)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Payment Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 w-full bg-slate-600"></div>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-medium text-slate-900">Last Payment</h3>
              {lastPayment ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date Received</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(lastPayment.received_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Applied Period</span>
                    <span className="font-medium text-slate-900">
                      {/* If you do split logic, you can show range. Just placeholder */}
                      N/A
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">AUM</span>
                    <span className="font-medium text-slate-900">N/A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Expected Fee</span>
                    <span className="font-medium text-slate-900">{lastPayment.actual_fee || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Amount Received</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900">
                              {formatCurrency(lastPayment.actual_fee || 0)}
                            </span>
                            {/* Some variance logic placeholder */}
                            {renderVarianceIndicator(lastPayment.actual_fee || 0, lastPayment.actual_fee || 0)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {renderVarianceTooltip(lastPayment.actual_fee || 0, lastPayment.actual_fee || 0)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500">No payment history</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {theMissed.length > 0 && (
        <div className="mt-6">
          <MissedPaymentsNotice missedPeriods={theMissed.map(mp => mp.period_label)} />
        </div>
      )}

      {!condensed && (
        <div className="mt-6">
          <PaymentForm clientId={clientId} onAddPayment={handleAddPayment} />
        </div>
      )}

      <div className="mt-6">
        <PaymentHistory
          payments={currentPayments}
          onViewAttachment={onViewAttachment}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
          condensed={condensed}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems: payments.length,
          }}
        />
      </div>
    </div>
  )
}
