// Updated to use real data
"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Building2, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define types
interface Client {
  client_id: string;
  display_name: string;
  current_period_status: string;
  client_name?: string; // Used in provider view
  provider_client_id?: string; // New composite key
}

interface Provider {
  provider_id: string;
  provider_name: string;
  clients: Client[];
}

interface AppSidebarProps {
  viewMode: 'client' | 'provider';
  setViewMode: (mode: 'client' | 'provider') => void;
  selectedClient: string;
  setSelectedClient: (client: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  clients: Client[];
  providers: Provider[];
  expandedProviders: string[];
  setExpandedProviders: React.Dispatch<React.SetStateAction<string[]>>;
}

export function AppSidebar({
  viewMode,
  setViewMode,
  selectedClient,
  setSelectedClient,
  searchQuery,
  setSearchQuery,
  sidebarCollapsed,
  setSidebarCollapsed,
  clients,
  providers,
  expandedProviders,
  setExpandedProviders,
}: AppSidebarProps) {
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);

  // Filter clients based on search query
  useEffect(() => {
    if (!clients || !providers) return;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();

      // Filter clients by name
      const matchedClients = clients.filter((client: Client) =>
        client.display_name.toLowerCase().includes(lowerQuery)
      );
      setFilteredClients(matchedClients);

      // Filter providers by name or their clients' names
      const matchedProviders = providers.filter((provider: Provider) =>
        provider.provider_name.toLowerCase().includes(lowerQuery) ||
        provider.clients.some((client: Client) =>
          client.client_name?.toLowerCase().includes(lowerQuery)
        )
      );
      setFilteredProviders(matchedProviders);
    } else {
      setFilteredClients(clients);
      setFilteredProviders(providers);
    }
  }, [searchQuery, clients, providers]);

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev: string[]) => {
      if (prev.includes(providerId)) {
        return prev.filter((id: string) => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div
      className={cn(
        "h-full border-r bg-slate-50 transition-all duration-300",
        sidebarCollapsed ? "w-0" : "w-72"
      )}
    >
      <div className={cn("h-full flex flex-col", sidebarCollapsed && "hidden")}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Button
              variant={viewMode === "client" ? "default" : "outline"}
              className="w-full"
              onClick={() => setViewMode("client")}
            >
              <Users className="mr-2 h-4 w-4" />
              Clients
            </Button>
            <Button
              variant={viewMode === "provider" ? "default" : "outline"}
              className="w-full"
              onClick={() => setViewMode("provider")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Providers
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {viewMode === "client" ? (
            <div className="p-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? "No clients found" : "No clients available"}
                </div>
              ) : (
                filteredClients.map((client: Client, index: number) => (
                  <button
                    key={`client-${client.client_id}-${index}`}
                    className={cn(
                      "flex items-center justify-between w-full rounded-lg px-3 py-2 mb-1 text-left text-sm",
                      selectedClient === client.display_name
                        ? "bg-blue-100 text-blue-900"
                        : "hover:bg-slate-100"
                    )}
                    onClick={() => setSelectedClient(client.display_name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        client.current_period_status === "Paid" ? "bg-green-500" : "bg-amber-500"
                      )}></div>
                      <span>{client.display_name}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredProviders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? "No providers found" : "No providers available"}
                </div>
              ) : (
                filteredProviders.map((provider: Provider, providerIndex: number) => (
                  <div key={`provider-${provider.provider_id}-${providerIndex}`} className="mb-1">
                    <button
                      className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                      onClick={() => toggleProvider(provider.provider_id)}
                    >
                      <span>{provider.provider_name}</span>
                      {expandedProviders.includes(provider.provider_id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {expandedProviders.includes(provider.provider_id) && (
                      <div className="ml-4 mt-1 border-l pl-2">
                        {provider.clients.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No clients
                          </div>
                        ) : (
                          provider.clients.map((client: Client, clientIndex: number) => (
                            <button
                              key={client.provider_client_id || `provider-${provider.provider_id}-client-${client.client_id}-${clientIndex}`}
                              className={cn(
                                "flex items-center gap-3 w-full rounded-lg px-3 py-2 mb-1 text-left text-sm",
                                selectedClient === client.client_name
                                  ? "bg-blue-100 text-blue-900"
                                  : "hover:bg-slate-100"
                              )}
                              onClick={() => setSelectedClient(client.client_name || "")}
                            >
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                client.current_period_status === "Paid" ? "bg-green-500" : "bg-amber-500"
                              )}></div>
                              <span>{client.client_name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}