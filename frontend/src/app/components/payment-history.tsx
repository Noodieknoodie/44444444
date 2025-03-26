"use client"

import React from "react"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRightIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Client, Payment } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditPaymentForm } from "@/components/edit-payment-form"

interface PaymentHistoryProps {
  payments: Payment[]
  client?: Client
  onViewAttachment: (url: string) => void
  onEditPayment: (payment: Payment) => void
  onDeletePayment: (paymentId: string) => void
  condensed?: boolean
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems: number
  }
}

export function PaymentHistory({
  payments,
  client,
  onViewAttachment,
  onEditPayment,
  onDeletePayment,
  condensed = false,
  pagination,
}: PaymentHistoryProps) {
  const [expandedPaymentIds, setExpandedPaymentIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>("dateReceived")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const toggleExpand = (paymentId: string) => {
    setExpandedPaymentIds((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId],
    )
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment)
    setShowDeleteDialog(true)
  }

  const handleEditClick = (payment: Payment) => {
    setPaymentToEdit(payment)
    setShowEditDialog(true)
  }

  const confirmDelete = () => {
    if (paymentToDelete) {
      onDeletePayment(paymentToDelete.id)
      setPaymentToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  const handleEditSubmit = (updatedPayment: Payment) => {
    onEditPayment(updatedPayment)
    setPaymentToEdit(null)
    setShowEditDialog(false)
  }

  const handleEditCancel = () => {
    setPaymentToEdit(null)
    setShowEditDialog(false)
  }

  const getVarianceStatus = (payment: Payment) => {
    const variance = payment.amount - payment.expectedFee
    const variancePercent = (variance / payment.expectedFee) * 100

    if (Math.abs(variance) <= 3) {
      return { status: "match", label: "Within Target", icon: CheckCircle, color: "text-slate-500" }
    } else if (variance > 0) {
      return { status: "overpaid", label: "Overpaid", icon: AlertCircle, color: "text-slate-700" }
    } else {
      return { status: "underpaid", label: "Underpaid", icon: AlertTriangle, color: "text-amber-600" }
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
          {pagination && (
            <div className="text-sm text-slate-500">
              Showing {payments.length} of {pagination.totalItems} payments
            </div>
          )}
        </div>

        <div className="rounded-md border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort("dateReceived")}
                  >
                    Date
                    {sortField === "dateReceived" && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort("periodApplied")}
                  >
                    Period
                    {sortField === "periodApplied" && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                {!condensed && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3 font-medium"
                      onClick={() => handleSort("aum")}
                    >
                      AUM
                      {sortField === "aum" && (
                        <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                      )}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort("expectedFee")}
                  >
                    Expected
                    {sortField === "expectedFee" && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-medium"
                    onClick={() => handleSort("amount")}
                  >
                    Actual
                    {sortField === "amount" && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={condensed ? 6 : 7} className="h-24 text-center">
                    No payment records found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const isMultiPeriod = Array.isArray(payment.periodApplied)
                  const isExpanded = expandedPaymentIds.includes(payment.id)
                  const variance = getVarianceStatus(payment)
                  const VarianceIcon = variance.icon

                  return (
                    <React.Fragment key={payment.id}>
                      <TableRow
                        className={`group hover:bg-slate-50 ${isMultiPeriod ? "cursor-pointer" : ""}`}
                        onClick={isMultiPeriod ? () => toggleExpand(payment.id) : undefined}
                      >
                        <TableCell className="font-medium">{formatDate(payment.dateReceived)}</TableCell>
                        <TableCell>
                          {isMultiPeriod ? (
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                              )}
                              <span>
                                {(payment.periodApplied as string[])[0]} -{" "}
                                {(payment.periodApplied as string[])[(payment.periodApplied as string[]).length - 1]}
                              </span>
                              <Badge variant="outline" className="ml-1.5 bg-slate-50 text-xs">
                                {(payment.periodApplied as string[]).length} periods
                              </Badge>
                            </div>
                          ) : (
                            payment.periodApplied
                          )}
                        </TableCell>
                        {!condensed && <TableCell className="text-right">{formatCurrency(payment.aum)}</TableCell>}
                        <TableCell className="text-right">{formatCurrency(payment.expectedFee)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <VarianceIcon className={`h-3.5 w-3.5 ${variance.color}`} />
                            <span className={variance.color}>
                              {formatCurrency(payment.amount - payment.expectedFee)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-start ml-auto space-x-0">
                            {payment.attachmentUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                onClick={() => onViewAttachment(payment.attachmentUrl!)}
                              >
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">View Attachment</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                              onClick={() => handleEditClick(payment)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(payment)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isMultiPeriod && (
                        <TableRow>
                          <TableCell colSpan={condensed ? 6 : 7} className="p-0">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent>
                                <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
                                  <div className="space-y-2 text-sm">
                                    {(payment.periodApplied as string[]).map((period, i) => (
                                      <div
                                        key={i}
                                        className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0"
                                      >
                                        <span className="text-slate-600">{period}</span>
                                        <span className="font-medium text-slate-900">
                                          {formatCurrency(payment.amount / (payment.periodApplied as string[]).length)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>

              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  className={pagination.currentPage === i + 1 ? "bg-slate-800 hover:bg-slate-700" : ""}
                  onClick={() => pagination.onPageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
              {paymentToDelete && (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500">Date:</div>
                    <div className="font-medium">
                      {paymentToDelete.dateReceived && formatDate(paymentToDelete.dateReceived)}
                    </div>
                    <div className="text-slate-500">Period:</div>
                    <div className="font-medium">
                      {Array.isArray(paymentToDelete.periodApplied)
                        ? `${paymentToDelete.periodApplied[0]} - ${paymentToDelete.periodApplied[paymentToDelete.periodApplied.length - 1]}`
                        : paymentToDelete.periodApplied}
                    </div>
                    <div className="text-slate-500">Amount:</div>
                    <div className="font-medium">{formatCurrency(paymentToDelete.amount)}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Payment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Make changes to the payment record below.</DialogDescription>
          </DialogHeader>
          {paymentToEdit && client && (
            <div className="bg-slate-50 p-4 rounded-md">
              <EditPaymentForm
                client={client}
                payment={paymentToEdit}
                onSave={handleEditSubmit}
                onCancel={handleEditCancel}
              />
            </div>
          )}
          {paymentToEdit && !client && (
            <div className="p-4 text-center text-amber-600">Client data is missing. Please try again.</div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

