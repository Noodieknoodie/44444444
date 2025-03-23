"use client"

import { useState } from "react"
import { FileText, Edit, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Client } from "@/hooks/use-client-data"
import { usePaymentData } from "@/hooks/use-payment-data"

interface PaymentHistoryProps {
  currentClient?: Client | null
  togglePdfViewer: () => void
  showPdfViewer?: boolean
  onViewDocument?: (id: string) => void
}

export function PaymentHistory({ currentClient, togglePdfViewer, showPdfViewer, onViewDocument }: PaymentHistoryProps) {
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const clientId = currentClient?.client_id?.toString() || null
  const { payments, pagination, loading } = usePaymentData(clientId, currentPage)

  // Toggle expanded payment
  const toggleExpandPayment = (id: string) => {
    if (expandedPayment === id) {
      setExpandedPayment(null)
    } else {
      setExpandedPayment(id)
    }
  }

  const handleViewDocument = (id: string) => {
    if (onViewDocument) {
      onViewDocument(id)
    } else if (!showPdfViewer) {
      togglePdfViewer()
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2 px-4 bg-blue-600 text-white">
        <CardTitle className="text-base font-semibold flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-7 bg-slate-50 text-xs font-medium text-slate-600 border-b">
            <div className="px-4 py-2.5">Date</div>
            <div className="px-4 py-2.5">Period</div>
            <div className="px-4 py-2.5">AUM</div>
            <div className="px-4 py-2.5">Expected Fee</div>
            <div className="px-4 py-2.5">Amount Received</div>
            <div className="px-4 py-2.5">Variance</div>
            <div className="px-4 py-2.5">Actions</div>
          </div>
          
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              Loading payment history...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No payment history found
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {payments.map((payment) => (
                <div key={payment.payment_id}>
                  <div
                    className={cn(
                      "grid grid-cols-7 text-sm text-slate-700 hover:bg-slate-50 transition-colors",
                      payment.is_split && "cursor-pointer",
                    )}
                    onClick={() => payment.is_split && toggleExpandPayment(payment.payment_id)}
                  >
                    <div className="px-4 py-3 flex items-center">
                      {payment.is_split && (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 mr-1 text-slate-400 transition-transform",
                            expandedPayment === payment.payment_id ? "transform rotate-0" : "transform rotate-270",
                          )}
                        />
                      )}
                      {new Date(payment.received_date).toLocaleDateString()}
                    </div>
                    <div className="px-4 py-3">{payment.period_label}</div>
                    <div className="px-4 py-3">${payment.total_assets.toLocaleString()}</div>
                    <div className="px-4 py-3">${payment.expected_fee.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                    <div className="px-4 py-3">${payment.actual_fee.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                    <div className="px-4 py-3">
                      {payment.variance === 0 ? (
                        <span className="text-emerald-600">$0</span>
                      ) : payment.variance > 0 ? (
                        <span className="text-blue-600">+${payment.variance.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                      ) : (
                        <span className="text-amber-600">-${Math.abs(payment.variance).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                      )}
                    </div>
                    <div className="px-4 py-3 flex items-center space-x-2">
                      {false && ( // payment.hasAttachment would go here in future
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 text-slate-500"
                          onClick={() => handleViewDocument(payment.payment_id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-500">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Payment</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-date">Date Received</Label>
                                <Input id="edit-date" type="date" defaultValue={payment.received_date} />
                              </div>
                              <div>
                                <Label htmlFor="edit-period">Period</Label>
                                <Select defaultValue={payment.period_label.toLowerCase().replace(/\s+/g, "-")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={payment.period_label.toLowerCase().replace(/\s+/g, "-")}>
                                      {payment.period_label}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input id="edit-amount" type="text" defaultValue={payment.actual_fee} />
                              </div>
                              <div>
                                <Label htmlFor="edit-aum">AUM</Label>
                                <Input id="edit-aum" type="text" defaultValue={payment.total_assets} />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600 text-slate-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Split payment details */}
                  {payment.is_split && expandedPayment === payment.payment_id && payment.splitPayments && (
                    <div className="bg-slate-50 border-t px-4 py-2">
                      {payment.splitPayments.map((split, index) => (
                        <div key={index} className="grid grid-cols-7 text-xs text-slate-600 py-2">
                          <div className="col-span-1 pl-6">-</div>
                          <div className="col-span-1">{split.period}</div>
                          <div className="col-span-1">${split.aum.toLocaleString()}</div>
                          <div className="col-span-1">${split.expected.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          <div className="col-span-1">${split.received.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          <div className="col-span-1">$0</div>
                          <div className="col-span-1">-</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-500">
              Showing {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)} to{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} payments
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.page === 1 || loading}
                className="h-8 px-3"
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={pagination.page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                  className={cn("h-8 w-8 p-0", pagination.page === page ? "bg-blue-600" : "")}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                disabled={pagination.page === pagination.totalPages || loading}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
