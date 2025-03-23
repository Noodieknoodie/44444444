"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavigation } from "@/components/top-navigation"
import { ClientHeader } from "@/components/client-header"
import { QuarterlyStatus } from "@/components/quarterly-status"
import { PaymentHistory } from "@/components/payment-history"
import { AddPaymentCard } from "@/components/add-payment-card"
import { PdfViewer } from "@/components/pdf-viewer"
import { useClientData } from "@/hooks/use-client-data"

export default function Home() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  
  const { 
    clients, 
    currentClient, 
    currentPeriod,
    loading 
  } = useClientData(selectedClientId)
  
  const selectedClientName = currentClient?.display_name || ""

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
  }

  const togglePdfViewer = () => {
    setShowPdfViewer(!showPdfViewer)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <TopNavigation />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar 
          clients={clients} 
          onSelectClient={handleClientSelect} 
          selectedClientId={selectedClientId}
          loading={loading}
        />
        
        <div className="flex-1 overflow-y-auto">
          {selectedClientId && (
            <>
              <ClientHeader
                selectedClient={selectedClientName}
                currentClient={currentClient}
              />
              
              <div className="p-4 sm:p-6 space-y-4">
                <QuarterlyStatus currentClient={currentClient} />
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-2">
                    <PaymentHistory
                      currentClient={currentClient}
                      togglePdfViewer={togglePdfViewer}
                      showPdfViewer={showPdfViewer}
                    />
                  </div>
                  
                  <div>
                    <AddPaymentCard currentClient={currentClient} />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {!selectedClientId && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-slate-800">401(k) Payment Management System</h1>
                <p className="mt-2 text-slate-500">Select a client from the sidebar to get started</p>
              </div>
            </div>
          )}
        </div>
        
        {showPdfViewer && (
          <PdfViewer onClose={togglePdfViewer} />
        )}
      </div>
    </div>
  )
}
