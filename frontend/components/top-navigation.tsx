"use client"

import { useState } from "react"
import { Menu, DollarSign, BarChart2, Users, Download, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useClientData } from "@/hooks/use-client-data"

interface TopNavigationProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export function TopNavigation({ sidebarCollapsed, setSidebarCollapsed }: TopNavigationProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  const { providers, clients } = useClientData("")

  // Handle provider selection
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value)

    // Pre-select all clients associated with this provider
    const providerClients = clients.filter((client) => client.provider === value)
    setSelectedClients(providerClients.map((client) => client.name))
  }

  // Handle client selection toggle
  const toggleClientSelection = (clientName: string) => {
    if (selectedClients.includes(clientName)) {
      setSelectedClients(selectedClients.filter((name) => name !== clientName))
    } else {
      setSelectedClients([...selectedClients, clientName])
    }
  }

  // Get clients for selected provider
  const providerClients = selectedProvider ? clients.filter((client) => client.provider === selectedProvider) : []

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center">
          {sidebarCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 h-7 w-7 p-0 hover:bg-blue-50 text-blue-600"
              onClick={() => setSidebarCollapsed(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="mr-2 opacity-0 pointer-events-none h-7 w-7 p-0">
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <nav className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-blue-600 font-medium">
              <DollarSign className="mr-1 h-3.5 w-3.5" />
              Payments
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-slate-100 hover:text-slate-800">
              <BarChart2 className="mr-1 h-3.5 w-3.5" />
              Quarterly Summary
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-slate-100 hover:text-slate-800">
              <Users className="mr-1 h-3.5 w-3.5" />
              Manage Clients
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-slate-100 hover:text-slate-800">
              <Download className="mr-1 h-3.5 w-3.5" />
              Export Data
            </Button>
          </nav>
        </div>

        {/* Upload File Button */}
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload File
        </Button>

        {/* Upload File Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* File Input */}
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" />
              </div>

              {/* Document Type */}
              <div className="grid gap-2">
                <Label htmlFor="type">Document Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="statement">Statement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Selection */}
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.name} value={provider.name}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Selection */}
              {selectedProvider && (
                <div className="grid gap-2">
                  <Label>Associated Clients</Label>
                  <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto">
                    {providerClients.length > 0 ? (
                      <div className="space-y-2">
                        {providerClients.map((client) => (
                          <div key={client.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={`client-${client.name}`}
                              checked={selectedClients.includes(client.name)}
                              onCheckedChange={() => toggleClientSelection(client.name)}
                            />
                            <Label htmlFor={`client-${client.name}`} className="text-sm font-normal cursor-pointer">
                              {client.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No clients found for this provider</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button type="submit">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

