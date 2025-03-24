"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { clientsApi, paymentsApi } from "@/lib/api";
import { formatCurrency, formatPercent, calculateExpectedFee } from "@/lib/utils";

export function AddPaymentCard({ currentClient }: { currentClient: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [expectedFee, setExpectedFee] = useState<number | null>(null);
  const [isEstimatedFee, setIsEstimatedFee] = useState(false);
  const [monthlyPeriods, setMonthlyPeriods] = useState<any[]>([]);
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    receivedDate: new Date().toISOString().slice(0, 10),
    totalAssets: "",
    actualFee: "",
    method: "Check",
    notes: "",
    appliedStartPeriod: "",
    appliedEndPeriod: "",
  });

  // Reset form when client changes
  useEffect(() => {
    if (!currentClient) return;

    const today = new Date().toISOString().slice(0, 10);
    setFormData({
      receivedDate: today,
      totalAssets: "",
      actualFee: "",
      method: "Check",
      notes: "",
      appliedStartPeriod: "",
      appliedEndPeriod: "",
    });
    setIsSplitPayment(false);
    setError(null);
    setSuccess(null);
  }, [currentClient]);

  // Load available periods
  useEffect(() => {
    async function fetchPeriods() {
      try {
        const [monthlyData, quarterlyData] = await Promise.all([
          paymentsApi.getAvailableMonthlyPeriods(),
          paymentsApi.getAvailableQuarterlyPeriods()
        ]);

        setMonthlyPeriods(monthlyData);
        setQuarterlyPeriods(quarterlyData);

        // Set default period based on client's payment schedule
        if (currentClient?.payment_schedule === 'monthly' && monthlyData.length > 0) {
          setFormData(prev => ({
            ...prev,
            appliedStartPeriod: monthlyData[0].period_key.toString(),
            appliedEndPeriod: monthlyData[0].period_key.toString(),
          }));
        } else if (currentClient?.payment_schedule === 'quarterly' && quarterlyData.length > 0) {
          setFormData(prev => ({
            ...prev,
            appliedStartPeriod: quarterlyData[0].period_key.toString(),
            appliedEndPeriod: quarterlyData[0].period_key.toString(),
          }));
        }
      } catch (err) {
        console.error("Error fetching periods:", err);
        setError("Failed to load period options");
      }
    }

    if (currentClient) {
      fetchPeriods();
    }
  }, [currentClient]);

  // Calculate expected fee when assets change
  useEffect(() => {
    if (!currentClient) return;

    async function calculateFee() {
      try {
        const aum = formData.totalAssets ? parseFloat(formData.totalAssets) : undefined;
        const data = await clientsApi.getExpectedFee(currentClient.client_id, aum);

        setExpectedFee(data.expected_fee);
        setIsEstimatedFee(data.is_estimated);
      } catch (err) {
        console.error("Error calculating fee:", err);
      }
    }

    calculateFee();
  }, [currentClient, formData.totalAssets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSplitPaymentChange = (checked: boolean) => {
    setIsSplitPayment(checked);

    // If turning off split payment, set end period equal to start period
    if (!checked) {
      setFormData(prev => ({
        ...prev,
        appliedEndPeriod: prev.appliedStartPeriod,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentClient) return;

    try {
      setLoading(true);
      setError(null);

      // Parse values
      const totalAssets = formData.totalAssets ? parseFloat(formData.totalAssets) : null;
      const actualFee = parseFloat(formData.actualFee);

      if (isNaN(actualFee) || actualFee <= 0) {
        throw new Error("Please enter a valid payment amount");
      }

      const isMonthly = currentClient.payment_schedule === 'monthly';
      const startPeriodKey = parseInt(formData.appliedStartPeriod);
      const endPeriodKey = parseInt(formData.appliedEndPeriod);

      // Split into components based on payment schedule
      let payload: any = {
        client_id: currentClient.client_id,
        contract_id: currentClient.contract_id,
        received_date: formData.receivedDate,
        total_assets: totalAssets,
        actual_fee: actualFee,
        method: formData.method,
        notes: formData.notes,
      };

      if (isMonthly) {
        // Monthly - format is YYYYMM
        payload.applied_start_month = startPeriodKey % 100;
        payload.applied_start_month_year = Math.floor(startPeriodKey / 100);
        payload.applied_end_month = endPeriodKey % 100;
        payload.applied_end_month_year = Math.floor(endPeriodKey / 100);
      } else {
        // Quarterly - format is YYYYQ
        payload.applied_start_quarter = startPeriodKey % 10;
        payload.applied_start_quarter_year = Math.floor(startPeriodKey / 10);
        payload.applied_end_quarter = endPeriodKey % 10;
        payload.applied_end_quarter_year = Math.floor(endPeriodKey / 10);
      }

      // Submit payment
      await paymentsApi.create(payload);

      // Success feedback
      setSuccess("Payment added successfully!");

      // Reset form
      setFormData({
        receivedDate: new Date().toISOString().slice(0, 10),
        totalAssets: "",
        actualFee: "",
        method: "Check",
        notes: "",
        appliedStartPeriod: formData.appliedStartPeriod, // Keep the same period
        appliedEndPeriod: formData.appliedStartPeriod,
      });
      setIsSplitPayment(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error("Error adding payment:", err);
      setError(err.message || "Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  if (!currentClient) return null;

  const periods = currentClient.payment_schedule === 'monthly' ? monthlyPeriods : quarterlyPeriods;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivedDate">Date Received</Label>
              <Input
                id="receivedDate"
                name="receivedDate"
                type="date"
                value={formData.receivedDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Wire">Wire</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appliedStartPeriod">Applied Period</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={formData.appliedStartPeriod.toString()}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      appliedStartPeriod: value,
                      // If not split payment, end = start
                      appliedEndPeriod: isSplitPayment ? formData.appliedEndPeriod : value
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.period_key} value={period.period_key.toString()}>
                        {period.display_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="splitPayment"
                    checked={isSplitPayment}
                    onCheckedChange={handleSplitPaymentChange}
                  />
                  <label
                    htmlFor="splitPayment"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Split
                  </label>
                </div>
              </div>
            </div>

            {isSplitPayment && (
              <div className="space-y-2">
                <Label htmlFor="appliedEndPeriod">End Period</Label>
                <Select
                  value={formData.appliedEndPeriod.toString()}
                  onValueChange={(value) => setFormData({ ...formData, appliedEndPeriod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods
                      .filter(p => parseInt(p.period_key) >= parseInt(formData.appliedStartPeriod))
                      .map((period) => (
                        <SelectItem key={period.period_key} value={period.period_key.toString()}>
                          {period.display_label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAssets">Assets Under Management</Label>
              <Input
                id="totalAssets"
                name="totalAssets"
                type="number"
                placeholder="$"
                value={formData.totalAssets}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="actualFee">Amount Received</Label>
                {expectedFee !== null && (
                  <span className="text-xs text-muted-foreground">
                    Expected: {formatCurrency(expectedFee)}
                    {isEstimatedFee && " (est.)"}
                  </span>
                )}
              </div>
              <Input
                id="actualFee"
                name="actualFee"
                type="number"
                placeholder="$"
                value={formData.actualFee}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Optional notes about this payment"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}
          {success && <div className="text-sm text-green-500">{success}</div>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  receivedDate: new Date().toISOString().slice(0, 10),
                  totalAssets: "",
                  actualFee: "",
                  method: "Check",
                  notes: "",
                  appliedStartPeriod: periods[0]?.period_key.toString() || "",
                  appliedEndPeriod: periods[0]?.period_key.toString() || "",
                });
                setIsSplitPayment(false);
                setError(null);
                setSuccess(null);
              }}
            >
              Clear Form
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}