import { AlertCircle } from "lucide-react"

interface MissedPaymentsNoticeProps {
  missedPeriods: string[]
}

export function MissedPaymentsNotice({ missedPeriods }: MissedPaymentsNoticeProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-slate-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-slate-900">Missing Payments</h3>
          <div className="mt-2 text-sm text-slate-700">
            <p>The following payment periods are missing:</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {missedPeriods.map((period, index) => (
                <span
                  key={index}
                  className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                >
                  {period}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

