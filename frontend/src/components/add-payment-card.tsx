"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, CheckCircle, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import type { Client } from "@/hooks/use-client-data"
import { usePaymentData } from "@/hooks/use-payment-data"
import { toast } from "sonner"

interface AddPaymentCardProps {
  currentClient?: Client | null
}

export function AddPaymentCard({ currentClient }: AddPaymentCardProps) {
  const [splitPayment, setSplitPayment] = useState(false)
  const [amount, setAmount] = useState("")
  const [aum, setAum] = useState("")
  const [receivedDate, setReceivedDate] = useState("")
  const [period, setPeriod] = useState("")
  const [startPeriod, setStartPeriod] = useState("")
  const [endPeriod, setEndPeriod] = useState("")
  const [availablePeriods, setAvailablePeriods] = useState<{ value: string, label: string, month?: number, quarter?: number, year: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get current client's missing periods
  const clientId = currentClient?.client_id?.toString()
  const { addPayment } = usePaymentData(clientId)

  useEffect(() => {
    if (currentClient) {
      // Set AUM from current client
      setAum(currentClient.current_aum?.toString() || "")
      
      // Prepare available periods based on missing periods
      // This would ideally fetch from the API
      const periodsList = []
      
      if (currentClient.missingPeriods && currentClient.missingPeriods.length > 0) {
        // Real data from missing periods
        for (const periodLabel of currentClient.missingPeriods) {
          // Parse period label - assuming format like "Q1 2025" or "Jan 2025"
          let period = {
            value: periodLabel.replace(/\s+/g, "-").toLowerCase(),
            label: periodLabel,
            year: 0
          }
          
          if (periodLabel.startsWith("Q")) {
            // Quarterly period
            const [q, year] = periodLabel.split(" ")
            period.quarter = parseInt(q.substring(1))
            period.year = parseInt(year)
          } else {
            // Monthly period
            const [month, year] = periodLabel.split(" ")
            period.month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              .findIndex(m => m === month) + 1
            period.year = parseInt(year)
          }
          
          periodsList.push(period)
        }
      } else {
        // If no missing periods, use current period
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth() + 1
        
        if (currentClient.payment_schedule === 'monthly') {
          periodsList.push({
            value: `${today.toLocaleString('default', { month: 'short' })}-${year}`.toLowerCase(),
            label: `${today.toLocaleString('default', { month: 'short' })} ${year}`,
            month,
            year
          })
        } else {
          const quarter = Math.floor((month - 1) / 3) + 1
          periodsList.push({
            value: `q${quarter}-${year}`,
            label: `Q${quarter} ${year}`,
            quarter,
            year
          })
        }
      }
      
      setAvailablePeriods(periodsList)
    }
  }, [currentClient])

  // Format number with commas
  const formatNumber = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, "")

    // Format with commas
    const parts = numericValue.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    return parts.join(".")
  }

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setAmount(value)
  }

  // Handle AUM change
  const handleAumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setAum(value)
  }

  // Calculate expected fee
  const calculateExpectedFee = () => {
    if (!currentClient) return 0
    
    const aumValue = Number.parseFloat(aum.replace(/,/g, "")) || 0
    
    if (currentClient.fee_type === 'percentage' && currentClient.percent_rate) {
      return (aumValue * currentClient.percent_rate).toLocaleString(undefined, {maximumFractionDigits: 2})
    } else if (currentClient.fee_type === 'flat' && currentClient.flat_rate) {
      return currentClient.flat_rate.toLocaleString(undefined, {maximumFractionDigits: 2})
    }
    
    return "0.00"
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!currentClient || !clientId) return
    
    try {
      setIsSubmitting(true)
      
      const aumValue = Number.parseFloat(aum.replace(/,/g, "")) || 0
      const amountValue = Number.parseFloat(amount.replace(/,/g, "")) || 0
      
      if (!receivedDate) {
        toast.error("Please select a received date")
        return
      }
      
      if (!splitPayment && !period) {
        toast.error("Please select a period")
        return
      }
      
      if (splitPayment && (!startPeriod || !endPeriod)) {
        toast.error("Please select both start and end periods")
        return
      }
      
      if (amountValue <= 0) {
        toast.error("Please enter a valid payment amount")
        return
      }
      
      if (aumValue <= 0) {
        toast.error("Please enter a valid AUM value")
        return
      }
      
      // Prepare payment data
      const paymentData: any = {
        received_date: receivedDate,
        total_assets: aumValue,
        actual_fee: amountValue,
        is_split: splitPayment
      }
      
      // Add period information based on selection
      if (currentClient.payment_schedule === 'monthly') {
        if (splitPayment) {
          // Get start period info
          const startPeriodObj = availablePeriods.find(p => p.value === startPeriod)
          const endPeriodObj = availablePeriods.find(p => p.value === endPeriod)
          
          if (!startPeriodObj || !endPeriodObj) {
            toast.error("Invalid period selection")
            return
          }
          
          paymentData.start_period_month = startPeriodObj.month
          paymentData.start_period_year = startPeriodObj.year
          paymentData.end_period_month = endPeriodObj.month
          paymentData.end_period_year = endPeriodObj.year
        } else {
          // Single period
          const periodObj = availablePeriods.find(p => p.value === period)
          
          if (!periodObj) {
            toast.error("Invalid period selection")
            return
          }
          
          paymentData.period_month = periodObj.month
          paymentData.period_year = periodObj.year
        }
      } else {
        // Quarterly
        if (splitPayment) {
          // Get start period info
          const startPeriodObj = availablePeriods.find(p => p.value === startPeriod)
          const endPeriodObj = availablePeriods.find(p => p.value === endPeriod)
          
          if (!startPeriodObj || !endPeriodObj) {
            toast.error("Invalid period selection")
            return
          }
          
          paymentData.start_period_quarter = startPeriodObj.quarter
          paymentData.start_period_year = startPeriodObj.year
          paymentData.end_period_quarter = endPeriodObj.quarter
          paymentData.end_period_year = endPeriodObj.year
        } else {
          // Single period
          const periodObj = availablePeriods.find(p => p.value === period)
          
          if (!periodObj) {
            toast.error("Invalid period selection")
            return
          }
          
          paymentData.period_quarter = periodObj.quarter
          paymentData.period_year = periodObj.year
        }
      }
      
      // Submit payment
      const result = await addPayment(paymentData)
      
      if (result && result.success) {
        toast.success("Payment added successfully")
        
        // Reset form
        setPeriod("")
        setStartPeriod("")
        setEndPeriod("")
        setAmount("")
        setReceivedDate("")
        setSplitPayment(false)
      } else {
        toast.error(result?.error || "Failed to add payment")
      }
    } catch (error) {
      console.error("Payment submission error:", error)
      toast.error("An error occurred while submitting the payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clear form
  const handleClear = () => {
    setPeriod("")
    setStartPeriod("")
    setEndPeriod("")
    setAmount("")
    setReceivedDate("")
    setSplitPayment(false)
    setAum(currentClient?.current_aum?.toString() || "")
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2 px-4 bg-blue-600 text-white">
        <CardTitle className="text-base font-semibold flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3">
            <Label htmlFor="date-received" className="text-sm font-medium">
              Date Received
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="date-received"
                type="date"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="applied-period" className="text-sm font-medium">
                Applied Period
              </Label>
              <div className="flex items-center">
                <Label htmlFor="split-payment" className="text-xs mr-2 text-slate-500">
                  Split
                </Label>
                <Switch
                  id="split-payment"
                  checked={splitPayment}
                  onCheckedChange={setSplitPayment}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
            <div className="mt-1.5 flex space-x-2">
              {!splitPayment ? (
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Select value={startPeriod} onValueChange={setStartPeriod} className="w-1/2">
                    <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={endPeriod} onValueChange={setEndPeriod} className="w-1/2">
                    <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <div className="grid grid-cols-3 gap-4 h-full">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-2.5 top-2.5 text-slate-500">$</span>
                  <Input
                    id="amount"
                    type="text"
                    className="pl-7 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                    value={amount ? formatNumber(amount) : ""}
                    onChange={handleAmountChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="aum" className="text-sm font-medium">
                  AUM
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-2.5 top-2.5 text-slate-500">$</span>
                  <Input
                    id="aum"
                    type="text"
                    className="pl-7 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                    value={aum ? formatNumber(aum) : ""}
                    onChange={handleAumChange}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Expected Fee</Label>
                <div className="h-9 mt-1.5 flex items-center px-3 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
                  ${calculateExpectedFee()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t py-2 px-4 flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Add Notes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Attachment
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-200 hover:bg-slate-100"
            onClick={handleClear}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
