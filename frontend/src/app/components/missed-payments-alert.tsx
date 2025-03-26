import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface MissedPaymentsAlertProps {
  missedPeriods: string[]
}

export function MissedPaymentsAlert({ missedPeriods }: MissedPaymentsAlertProps) {
  return (
    <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-800 font-medium">Missing Payments</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">This client has {missedPeriods.length} missing payment period(s):</p>
        <div className="flex flex-wrap gap-2">
          {missedPeriods.map((period, index) => (
            <Badge key={index} variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
              {period}
            </Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

