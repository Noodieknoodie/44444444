import type { Client } from "@/hooks/use-client-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, DollarSign, Calendar, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

interface QuarterlyStatusProps {
  currentClient?: Client | null
}

export function QuarterlyStatus({ currentClient }: QuarterlyStatusProps) {
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)
  
  useEffect(() => {
    // Simple calculation for days remaining and progress
    // In a real implementation, this would use the actual due date from the system
    const calculateTimeRemaining = () => {
      // Today's date
      const today = new Date()
      // End of current month/quarter for due date approximation
      const dueDate = new Date()
      
      if (currentClient?.payment_schedule === 'monthly') {
        // For monthly, assume due 15 days after the end of the period
        dueDate.setMonth(dueDate.getMonth() + 1, 15) // 15th of next month
      } else {
        // For quarterly, assume due 15 days after the end of the quarter
        const currentQuarter = Math.floor(today.getMonth() / 3)
        dueDate.setMonth((currentQuarter + 1) * 3, 15) // 15th of first month of next quarter
      }
      
      // Calculate days remaining and progress percentage
      const totalDays = 30 // Simplified: assuming all periods have ~30 days of payment window
      const daysPassed = (today.getTime() - new Date(today.getFullYear(), today.getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24)
      const remainingDays = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      
      setDaysRemaining(remainingDays)
      setProgressPercent(Math.min(100, Math.round((daysPassed / totalDays) * 100)))
    }
    
    calculateTimeRemaining()
  }, [currentClient])

  if (!currentClient) return null

  // Calculate expected fee based on client's fee structure
  const calculateExpectedFee = () => {
    if (currentClient.fee_type === 'percentage' && currentClient.percent_rate) {
      return (currentClient.current_aum || 0) * currentClient.percent_rate
    } else if (currentClient.fee_type === 'flat' && currentClient.flat_rate) {
      return currentClient.flat_rate
    }
    return 0
  }

  const expectedFee = calculateExpectedFee()
  const isPaid = currentClient.currentStatus?.status === 'Paid'
  const isOverdue = daysRemaining < 0

  // Get the current period label from the client
  const currentPeriod = currentClient.currentStatus?.period_label || 
    (currentClient.payment_schedule === 'monthly' ? 'Current Month' : 'Current Quarter')

  // Get period date ranges (simplified - would need actual data from date_dimension)
  const getPeriodDateRange = () => {
    const today = new Date()
    const year = today.getFullYear()
    
    if (currentClient.payment_schedule === 'monthly') {
      const month = today.getMonth()
      return `${new Date(year, month, 1).toLocaleDateString()} - ${new Date(year, month + 1, 0).toLocaleDateString()}`
    } else {
      const quarter = Math.floor(today.getMonth() / 3)
      return `${new Date(year, quarter * 3, 1).toLocaleDateString()} - ${new Date(year, (quarter + 1) * 3, 0).toLocaleDateString()}`
    }
  }

  return (
    <Card>
      <CardHeader
        className={cn(
          "py-3 px-5 flex flex-row items-center justify-between",
          isPaid
            ? "bg-emerald-600 text-white"
            : isOverdue
              ? "bg-red-600 text-white"
              : "bg-amber-500 text-white",
        )}
      >
        <CardTitle className="text-lg font-semibold flex items-center">
          {isPaid ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              {currentPeriod} Payment Received
            </>
          ) : isOverdue ? (
            <>
              <AlertCircle className="h-5 w-5 mr-2" />
              {currentPeriod} Payment Overdue
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 mr-2" />
              {currentPeriod} Payment Pending
            </>
          )}
        </CardTitle>

        {!isPaid && (
          <Button
            variant={isOverdue ? "destructive" : "secondary"}
            size="sm"
            className={
              isOverdue
                ? "bg-white text-red-600 hover:bg-slate-100"
                : "bg-white text-amber-600 hover:bg-slate-100"
            }
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Record Payment
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 divide-x">
          <div className="p-4">
            <div className="text-sm font-medium text-blue-600 mb-1">Period</div>
            <div className="font-medium text-slate-900 flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-blue-500" />
              {currentPeriod}
            </div>
            <div className="mt-1 text-xs text-slate-500">{getPeriodDateRange()}</div>
          </div>
          <div className="p-4">
            <div className="text-sm font-medium text-blue-600 mb-1">Current AUM</div>
            <div className="font-medium text-slate-900 flex items-center">
              <BarChart2 className="h-4 w-4 mr-1.5 text-blue-500" />${(currentClient.current_aum || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-slate-500">{currentClient.num_people || 0} participants</div>
          </div>
          <div className="p-4">
            <div className="text-sm font-medium text-blue-600 mb-1">Expected Payment</div>
            <div className="font-medium text-slate-900 flex items-center">
              <DollarSign className="h-4 w-4 mr-1.5 text-blue-500" />${expectedFee.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Due by {new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000)).toLocaleDateString()}
            </div>
          </div>
        </div>

        {isPaid ? (
          <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
            <div className="text-sm text-emerald-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Payment of ${expectedFee.toLocaleString(undefined, {maximumFractionDigits: 2})} received
            </div>
            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">
              View Receipt
            </Button>
          </div>
        ) : (
          <div className="px-5 py-3 bg-slate-50 border-t flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-slate-700">
                {isOverdue ? (
                  <span className="flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Payment is {Math.abs(daysRemaining)} days overdue
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Payment due in {daysRemaining} days
                  </span>
                )}
              </div>
              <div className="text-sm font-medium">
                {progressPercent}% of time elapsed
              </div>
            </div>
            <Progress
              value={progressPercent}
              className={isOverdue ? "h-2 bg-red-100" : "h-2 bg-amber-100"}
              indicatorClassName={isOverdue ? "bg-red-500" : "bg-amber-500"}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
