"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavigation } from "@/components/top-navigation"
import { ClientHeader } from "@/components/client-header"
import { AddPaymentCard } from "@/components/add-payment-card"
import { LastPaymentSummary } from "@/components/last-payment-summary"
import { PaymentHistory } from "@/components/payment-history"
import { PdfViewer } from "@/components/pdf-viewer"
import { useClientData } from "@/hooks/use-client-data"
import { clientsApi, providersApi } from "@/lib/api"

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'client' | 'provider'>("client")
  const [selectedClient, setSelectedClient] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedProviders, setExpandedProviders] = useState<string[]>([])
  const [providers, setProviders] = useState<any[]>([])

  const { clients, currentClient, loading, error } = useClientData(selectedClient)

  // Fetch providers data
  useEffect(() => {
    async function fetchProviders() {
      try {
        const data = await providersApi.getAll();
        setProviders(data);
      } catch (err) {
        console.error("Error fetching providers:", err);
      }
    }

    fetchProviders();
  }, []);

  // Toggle PDF viewer
  const togglePdfViewer = () => {
    setShowPdfViewer(!showPdfViewer)
    if (!showPdfViewer) {
      setSidebarCollapsed(true)
    } else {
      setSidebarCollapsed(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar */}
      <AppSidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        clients={clients}
        providers={providers}
        expandedProviders={expandedProviders}
        setExpandedProviders={setExpandedProviders}
      />

      {/* Main Content */}
      <div className={cn("flex flex-col flex-1 transition-all duration-300", showPdfViewer ? "w-3/5" : "w-full")}>
        {/* Top Navigation */}
        <TopNavigation sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

        {/* Client Header */}
        <ClientHeader selectedClient={selectedClient} currentClient={currentClient} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {loading ? (
            <div className="grid gap-6">
              <div className="h-48 bg-white border rounded-lg animate-pulse"></div>
              <div className="h-48 bg-white border rounded-lg animate-pulse"></div>
              <div className="h-80 bg-white border rounded-lg animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              {error}
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Add Payment Card */}
              <AddPaymentCard currentClient={currentClient} />

              {/* Last Payment Summary */}
              <LastPaymentSummary currentClient={currentClient} />

              {/* Payment History */}
              <PaymentHistory currentClient={currentClient} togglePdfViewer={togglePdfViewer} />
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      {showPdfViewer && <PdfViewer selectedClient={selectedClient} togglePdfViewer={togglePdfViewer} />}
    </div>
  )
}