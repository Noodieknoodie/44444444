"use client"

import { useState } from "react"
import { Search, Building2, Users, PieChart, FileText, Settings, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Client } from "@/hooks/use-client-data"

interface AppSidebarProps {
  clients: Client[]
  onSelectClient: (clientId: string) => void
  selectedClientId: string | null
  loading?: boolean
}

export function AppSidebar({ clients, onSelectClient, selectedClientId, loading = false }: AppSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Filter clients based on search term
  const filteredClients = clients.filter((client) =>
    client.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-16 left-4 z-30">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-white border border-slate-200 shadow-sm"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`w-64 border-r bg-white ${
          isMobileMenuOpen ? "fixed inset-0 z-20 transform translate-x-0" : "fixed inset-0 transform -translate-x-full"
        } lg:relative lg:transform-none transition-transform duration-200 ease-in-out`}
      >
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <nav className="mt-4 space-y-1">
            <div className="flex items-center space-x-2 px-3 py-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Clients</span>
            </div>

            <div className="pl-2 max-h-[calc(100vh-230px)] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-500 text-sm">Loading clients...</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">No clients found</div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.client_id}
                    className={`w-full flex items-center rounded-md px-3 py-2 text-sm hover:bg-slate-100 ${
                      selectedClientId === client.client_id.toString()
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-800"
                    }`}
                    onClick={() => {
                      onSelectClient(client.client_id.toString())
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <span className="truncate">{client.display_name}</span>
                  </button>
                ))
              )}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
            <div className="space-y-1">
              <button className="w-full flex items-center rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
                <Users className="h-4 w-4 mr-2 text-slate-600" />
                <span>Providers</span>
              </button>
              <button className="w-full flex items-center rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
                <PieChart className="h-4 w-4 mr-2 text-slate-600" />
                <span>Analytics</span>
              </button>
              <button className="w-full flex items-center rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
                <FileText className="h-4 w-4 mr-2 text-slate-600" />
                <span>Reports</span>
              </button>
              <button className="w-full flex items-center rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
                <Settings className="h-4 w-4 mr-2 text-slate-600" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  )
}
