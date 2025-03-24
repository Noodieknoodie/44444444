// Updated to fetch real data

import { useState, useEffect } from "react";
import { clientsApi } from "@/lib/api";

export function usePaymentData(clientId: number | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPayments() {
      if (!clientId) {
        setPayments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await clientsApi.getPaymentHistory(clientId);
        setPayments(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching payment history:", err);
        setError("Failed to load payment history");
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [clientId]);

  return { payments, loading, error };
}