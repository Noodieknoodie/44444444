"use client"

import { useEffect, useState } from "react"
import { TopNavigation } from "@/components/top-navigation"
import { ClientSidebar } from "@/components/client-sidebar"
import { ClientDetails } from "@/components/client-details"
import { AttachmentViewer } from "@/components/attachment-viewer"

import { useClients } from "@/hooks/useApi" // <-- from your real code
import type { Client } from "@/hooks/useApi" // or your real type definitions from the API

export default function Dashboard() {
  const { getClients, clients, isLoading, error } = useClients()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // Fetch clients on mount
  useEffect(() => {
    getClients()
      .catch(err => {
        // handle error if needed
        console.error(err)
      })
  }, [getClients])

  // If we have clients loaded, pick the first if none selected
  useEffect(() => {
    if (!selectedClientId && clients?.items?.length) {
      setSelectedClientId(clients.items[0].client_id)
    }
  }, [clients, selectedClientId])

  const handleViewAttachment = (url: string) => {
    setAttachmentUrl(url)
    setSidebarVisible(false)
  }

  const handleCloseAttachment = () => {
    setAttachmentUrl(null)
    setSidebarVisible(true)
  }

  // We'll find the selected client from the array
  const selectedClient: Client | undefined =
    clients?.items.find((c) => c.client_id === selectedClientId)

  // Simple loading + error states
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading clients...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-red-500">
        <p>Error loading clients: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      <TopNavigation />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden when attachment viewer is open */}
        {sidebarVisible && (
          <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-white">
            <ClientSidebar
              clients={clients?.items || []}
              selectedClientId={selectedClientId || 0}
              onSelectClient={setSelectedClientId}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 overflow-auto transition-all ${attachmentUrl ? "w-[60%]" : "w-full"}`}>
          {selectedClient ? (
            <ClientDetails
              clientId={selectedClient.client_id}
              onViewAttachment={handleViewAttachment}
              condensed={!!attachmentUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-lg text-slate-500">Select a client to view details</p>
            </div>
          )}
        </div>

        {/* Attachment Viewer */}
        {attachmentUrl && (
          <div className="w-[40%] flex-shrink-0 border-l border-slate-200 bg-white">
            <AttachmentViewer url={attachmentUrl} onClose={handleCloseAttachment} />
          </div>
        )}
      </div>
    </div>
  )
}
