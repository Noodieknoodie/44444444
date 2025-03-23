import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Client } from "@/hooks/use-client-data"
import { Badge } from "@/components/ui/badge"

interface LastPaymentSummaryProps {
  currentClient?: Client
}

export function LastPaymentSummary({ currentClient }: LastPaymentSummaryProps) {
  if (!currentClient) return null

  // Calculate variance
  const variance = currentClient.lastPayment.amount - currentClient.lastPayment.expected

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2 px-4 bg-blue-600 text-white">
        <CardTitle className="text-base font-semibold flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          Last Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-5 divide-x">
          <div className="p-3 bg-slate-50">
            <div className="text-sm font-medium text-blue-600 mb-1">Date</div>
            <div className="font-medium text-slate-900">{currentClient?.lastPayment.date}</div>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-blue-600 mb-1">Period</div>
            <div className="font-medium text-slate-900">{currentClient?.lastPayment.period}</div>
          </div>
          <div className="p-3 bg-slate-50">
            <div className="text-sm font-medium text-blue-600 mb-1">AUM</div>
            <div className="font-medium text-slate-900">${currentClient?.lastPayment.aum.toLocaleString()}</div>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-blue-600 mb-1">Expected</div>
            <div className="font-medium text-slate-900">${currentClient?.lastPayment.expected.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-slate-50">
            <div className="text-sm font-medium text-blue-600 mb-1">Received</div>
            <div className="font-medium text-slate-900">${currentClient?.lastPayment.amount.toLocaleString()}</div>
          </div>
        </div>
        <div className="px-4 py-2 border-t flex justify-end items-center">
          {variance === 0 ? (
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Matches expected
            </Badge>
          ) : variance > 0 ? (
            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
              ${variance.toLocaleString()} over expected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
              ${Math.abs(variance).toLocaleString()} under expected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

