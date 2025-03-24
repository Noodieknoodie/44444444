// Updated to fetch real data

import { useState, useEffect, useMemo } from "react";
import { clientsApi, paymentsApi } from "@/lib/api";

export function useClientData(selectedClient: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const clientsData = await clientsApi.getAll();
        setClients(clientsData);

        // If we have a selected client name, find it in the returned data
        if (selectedClient && clientsData.length > 0) {
          const found = clientsData.find(
            (c: { client_id: number; display_name: string }) => c.display_name === selectedClient
          );

          if (found) {
            fetchClientDetails(found.client_id);
          } else {
            // If the selected client isn't found, select the first one
            fetchClientDetails(clientsData[0].client_id);
          }
        } else if (clientsData.length > 0) {
          // If no client is selected, use the first one
          fetchClientDetails(clientsData[0].client_id);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError("Failed to load clients");
      }
    }

    // Fetch current period for reference
    async function fetchCurrentPeriod() {
      try {
        const periodsData = await paymentsApi.getCurrentPeriods();
        setCurrentPeriod(periodsData);
      } catch (err) {
        console.error("Error fetching current period:", err);
      }
    }

    fetchClients();
    fetchCurrentPeriod();
  }, [selectedClient]);

  // Fetch client details when selected
  async function fetchClientDetails(clientId: number) {
    try {
      const clientData = await clientsApi.getById(clientId);
      setCurrentClient(clientData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching client details:", err);
      setError("Failed to load client details");
      setLoading(false);
    }
  }

  return {
    clients,
    providers,
    currentClient,
    loading,
    error,
    currentPeriod,
  };
}