"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn, formatCurrency } from "@/lib/utils"
import type { Client, Payment } from "@/lib/types"
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

interface EditPaymentFormProps {
  client: Client
  payment: Payment
  onSave: (updatedPayment: Payment) => void
  onCancel: () => void
  className?: string
}

export function EditPaymentForm({ client, payment, onSave, onCancel, className }: EditPaymentFormProps) {
  // Initialize form with existing payment data
  const [date, setDate] = useState<Date | undefined>(payment.dateReceived ? new Date(payment.dateReceived) : new Date())
  const [aum, setAum] = useState(payment.aum.toString())
  const [amount, setAmount] = useState(payment.amount.toString())
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(payment.attachmentUrl)

  // Handle period selection
  const [isDateRange, setIsDateRange] = useState(Array.isArray(payment.periodApplied))
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    Array.isArray(payment.periodApplied) ? payment.periodApplied[0] : payment.periodApplied,
  )
  const [endPeriod, setEndPeriod] = useState<string>(
    Array.isArray(payment.periodApplied) ? payment.periodApplied[payment.periodApplied.length - 1] : "",
  )

  // Track form state
  const [isDirty, setIsDirty] = useState(false)
  const [initialFormState, setInitialFormState] = useState({
    date: payment.dateReceived,
    aum: payment.aum.toString(),
    amount: payment.amount.toString(),
    attachmentUrl: payment.attachmentUrl,
    isDateRange: Array.isArray(payment.periodApplied),
    selectedPeriod: Array.isArray(payment.periodApplied) ? payment.periodApplied[0] : payment.periodApplied,
    endPeriod: Array.isArray(payment.periodApplied) ? payment.periodApplied[payment.periodApplied.length - 1] : "",
  })
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add safety checks for client data and availablePeriods
  // Update the availablePeriods initialization with a fallback
  const availablePeriods = client?.availablePeriods || ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"]

  // Track form dirty state
  useEffect(() => {
    const currentState = {
      date: date?.toISOString(),
      aum,
      amount,
      attachmentUrl,
      isDateRange,
      selectedPeriod,
      endPeriod,
    }

    // Check if any values have changed
    const hasChanged =
      currentState.date !== initialFormState.date ||
      currentState.aum !== initialFormState.aum ||
      currentState.amount !== initialFormState.amount ||
      currentState.attachmentUrl !== initialFormState.attachmentUrl ||
      currentState.isDateRange !== initialFormState.isDateRange ||
      currentState.selectedPeriod !== initialFormState.selectedPeriod ||
      currentState.endPeriod !== initialFormState.endPeriod ||
      attachment !== null

    setIsDirty(hasChanged)
  }, [date, aum, amount, attachmentUrl, isDateRange, selectedPeriod, endPeriod, attachment, initialFormState])

  // Update the calculateExpectedFee function to handle missing client data
  const calculateExpectedFee = () => {
    if (!aum || isNaN(Number.parseFloat(aum))) return 0
    if (!client) return 0

    const aumValue = Number.parseFloat(aum)

    if (client.rateType === "percent") {
      return (aumValue * client.rateAmount) / 100
    } else {
      return client.rateAmount
    }
  }

  const expectedFee = calculateExpectedFee()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!date || !aum || !amount || !selectedPeriod) {
      setIsSubmitting(false)
      return
    }

    let periodApplied: string | string[]

    if (isDateRange && endPeriod) {
      // Create an array of periods between selectedPeriod and endPeriod
      const startIndex = availablePeriods.indexOf(selectedPeriod)
      const endIndex = availablePeriods.indexOf(endPeriod)

      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex)
        const end = Math.max(startIndex, endIndex)
        periodApplied = availablePeriods.slice(start, end + 1)
      } else {
        periodApplied = [selectedPeriod]
      }
    } else {
      periodApplied = selectedPeriod
    }

    const updatedPayment: Payment = {
      ...payment,
      dateReceived: date.toISOString(),
      periodApplied,
      aum: Number.parseFloat(aum),
      amount: Number.parseFloat(amount),
      expectedFee,
      attachmentUrl: attachment ? URL.createObjectURL(attachment) : attachmentUrl,
    }

    // Simulate a brief loading state
    setTimeout(() => {
      onSave(updatedPayment)
      setIsSubmitting(false)
    }, 500)
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true)
    } else {
      onCancel()
    }
  }

  return (
    <Card className={cn("border-0 shadow-sm bg-white", className)}>
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edit Payment</h2>
            <p className="text-sm text-slate-500">Modify payment details for {client.name}</p>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Editing
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Date Received <span className="text-slate-400">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-slate-500")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Period Applied <span className="text-slate-400">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Date Range</span>
                  <Switch checked={isDateRange} onCheckedChange={setIsDateRange} />
                </div>
              </div>

              <div className="grid gap-2" style={{ gridTemplateColumns: isDateRange ? "1fr 1fr" : "1fr" }}>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeriods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isDateRange && (
                  <Select value={endPeriod} onValueChange={setEndPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="End period" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods
                        .filter((period) => period !== selectedPeriod)
                        .map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aum" className="text-sm font-medium">
                AUM
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
                <Input
                  id="aum"
                  placeholder="0.00"
                  className="pl-7"
                  value={aum}
                  onChange={(e) => setAum(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount <span className="text-slate-400">*</span>
                </Label>
                <span className="text-xs text-slate-500">Expected: {formatCurrency(expectedFee)}</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="attachment" className="text-sm font-medium">
                Attachment
              </Label>
              <Input
                id="attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAttachment(e.target.files[0])
                    setAttachmentUrl(null) // Clear the existing URL when a new file is selected
                  }
                }}
              />
              {(attachment || attachmentUrl) && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{attachment ? attachment.name : "Current attachment"}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setAttachment(null)
                      setAttachmentUrl(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="mr-1">*</span>Required fields
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!date || !aum || !amount || !selectedPeriod || (isDateRange && !endPeriod) || isSubmitting}
                className="bg-slate-800 hover:bg-slate-700"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>

        <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel editing?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction onClick={onCancel}>Yes, Cancel</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

