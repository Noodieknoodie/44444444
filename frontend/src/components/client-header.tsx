import { Users, Calendar, CheckCircle, AlertCircle, CircleAlert } from "lucide-react"
import type { Client } from "@/hooks/use-client-data"
import { cn } from "@/lib/utils"

interface ClientHeaderProps {
  selectedClient: string
  currentClient?: Client | null
}

export function ClientHeader({ selectedClient, currentClient }: ClientHeaderProps) {
  if (!currentClient) return null;

  // Format fee information for display
  const getFeeDisplay = () => {
    if (currentClient.fee_type === 'percentage' && currentClient.percent_rate) {
      const percentValue = currentClient.percent_rate * 100;
      const annualValue = percentValue * (currentClient.payment_schedule === 'monthly' ? 12 : 4);
      
      return (
        <>
          <span className="ml-1 px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium text-xs">
            {percentValue.toFixed(2)}% {currentClient.payment_schedule === 'monthly' ? 'Monthly' : 'Quarterly'}
          </span>
          <span className="mx-1">|</span>
          <span className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium text-xs">
            {annualValue.toFixed(2)}% Annually
          </span>
        </>
      );
    } else if (currentClient.fee_type === 'flat' && currentClient.flat_rate) {
      const annualValue = currentClient.flat_rate * (currentClient.payment_schedule === 'monthly' ? 12 : 4);
      
      return (
        <>
          <span className="ml-1 px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium text-xs">
            ${currentClient.flat_rate.toLocaleString()} {currentClient.payment_schedule === 'monthly' ? 'Monthly' : 'Quarterly'}
          </span>
          <span className="mx-1">|</span>
          <span className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium text-xs">
            ${annualValue.toLocaleString()} Annually
          </span>
        </>
      );
    }
    
    return <span className="ml-1 text-red-500">Missing fee information</span>;
  };

  return (
    <div className="bg-white border-b px-5 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-4 h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {selectedClient.substring(0, 1)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{selectedClient}</h1>
            <div className="flex items-center text-sm text-slate-500 mt-0.5">
              <span className="mr-3 flex items-center">
                <Users className="h-3.5 w-3.5 mr-1 text-blue-500" />
                {currentClient.num_people || 0} participants
              </span>
              <span className="mr-3">${(currentClient.current_aum || 0).toLocaleString()} AUM</span>
              <span>{currentClient.provider_name}</span>
            </div>
            {/* Payment schedule and fee information */}
            <div className="flex items-center text-sm text-slate-500 mt-1.5">
              <span className="mr-3 flex items-center">
                Payment Schedule:
                <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-medium text-xs">
                  {currentClient.payment_schedule === 'monthly' ? 'Monthly' : 'Quarterly'}
                </span>
              </span>
              <span className="flex items-center">
                Fee:
                {getFeeDisplay()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment status summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 min-w-[280px]">
          <table className="w-full text-sm">
            <tbody>
              {/* Current Period Row */}
              <tr>
                <td className="pb-2 align-top">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-500 mr-1.5" />
                    <span className="text-xs text-slate-500">Current Period:</span>
                  </div>
                </td>
                <td className="pb-2 text-right">
                  <span className="text-sm font-medium text-slate-800">
                    {currentClient.currentStatus?.period_label || (
                      currentClient.payment_schedule === 'monthly' 
                        ? 'Current Month' 
                        : 'Current Quarter'
                    )}
                  </span>
                </td>
              </tr>

              {/* Status Row */}
              <tr>
                <td className="pb-2 align-top">
                  <div className="flex items-center">
                    <CircleAlert className="h-4 w-4 text-blue-500 mr-1.5" />
                    <span className="text-xs text-slate-500">Status:</span>
                  </div>
                </td>
                <td className="pb-2 text-right">
                  <div
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded border",
                      currentClient.currentStatus?.status === "Paid"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border-amber-200 text-amber-700",
                    )}
                  >
                    {currentClient.currentStatus?.status === "Paid" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Paid</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Unpaid</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>

              {/* Missing Periods Row */}
              <tr>
                <td className="align-top">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-blue-500 mr-1.5" />
                    <span className="text-xs text-slate-500">Missing Periods:</span>
                  </div>
                </td>
                <td className="text-right">
                  {currentClient.missingPeriods && currentClient.missingPeriods.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {currentClient.missingPeriods.slice(0, 3).map((period, index) => (
                        <span
                          key={index}
                          className="text-xs font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                        >
                          {period}
                        </span>
                      ))}
                      {currentClient.missingPeriods.length > 3 && (
                        <span
                          className="text-xs font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                        >
                          +{currentClient.missingPeriods.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-800">None</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
