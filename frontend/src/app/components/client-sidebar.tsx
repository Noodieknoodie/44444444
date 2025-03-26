"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import type { Client } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClientSidebarProps {
  clients: Client[]
  selectedClientId: string
  onSelectClient: (clientId: string) => void
}

export function ClientSidebar({ clients, selectedClientId, onSelectClient }: ClientSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])

  const providers = Array.from(new Set(clients.map((client) => client.provider)))

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(client.provider)
    return matchesSearch && matchesProvider
  })

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) => (prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-4 border-b border-slate-200 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Clients</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search clients..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-2">
                <Filter className="h-4 w-4" />
                <span>Provider</span>
                {selectedProviders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedProviders.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {providers.map((provider) => (
                <DropdownMenuCheckboxItem
                  key={provider}
                  checked={selectedProviders.includes(provider)}
                  onCheckedChange={() => toggleProvider(provider)}
                >
                  {provider}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-auto">
        <ul className="divide-y divide-slate-100">
          {filteredClients.map((client) => {
            const hasMissedPeriods = client.missedPeriods && client.missedPeriods.length > 0

            return (
              <li key={client.id}>
                <button
                  className={`group relative w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                    client.id === selectedClientId ? "bg-slate-100 border-l-2 border-slate-600" : ""
                  }`}
                  onClick={() => onSelectClient(client.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-sm text-slate-500">{client.provider}</div>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 ${client.currentPeriodPaid ? "bg-slate-300" : "bg-amber-500"}`}
                      title={client.currentPeriodPaid ? "Current period paid" : "Payment pending"}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-xs text-slate-500">
                      {client.paymentSchedule === "monthly" ? "Monthly" : "Quarterly"}
                    </div>
                    {hasMissedPeriods && (
                      <div className="text-xs text-amber-600">{client.missedPeriods?.length} missed</div>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
          {filteredClients.length === 0 && <li className="px-4 py-8 text-center text-slate-500">No clients found</li>}
        </ul>
      </div>
    </div>
  )
}

