// Date formatting utilities
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Invalid date format:', dateString);
    return 'Invalid date';
  }
}

// Currency formatting utilities
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  // Under $10K show 2 decimals (default)
  const decimals = Math.abs(amount) < 10000 ? 2 : 2;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

// Formats an amount with display of N/A when appropriate
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

// Formats a percentage (e.g., 0.75 becomes "0.75%")
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  
  // Under 1% show 4 decimals, over 1% show 2
  const absValue = Math.abs(value / 100);
  const decimals = absValue < 0.01 ? 4 : 2;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

// Format payment status with appropriate styling class
export function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'text-green-600 dark:text-green-400 font-medium';
    case 'unpaid':
    case 'due':
      return 'text-red-600 dark:text-red-400 font-medium';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

// Interface for client with payment history for AUM tracking
interface ClientWithPayments {
  client_id: number;
  payments?: {
    received_date: string;
    total_assets: number | null | undefined;
  }[];
}

// Format expected fee based on contract details with AUM fallback logic
export function calculateExpectedFee(
  feeType: string | undefined | null,
  flatRate: number | undefined | null,
  percentRate: number | undefined | null,
  totalAssets: number | undefined | null,
  clientHistory?: ClientWithPayments
): { fee: number | null; isEstimated: boolean; message?: string } {
  // If no fee type, return null
  if (!feeType) return { fee: null, isEstimated: false };
  
  // For flat fee, just return the flat rate
  if (feeType.toLowerCase() === 'flat' || feeType.toLowerCase() === 'fixed') {
    return { fee: flatRate || null, isEstimated: false };
  }
  
  // For percentage fee with current assets, calculate directly
  if (feeType.toLowerCase() === 'percentage' && percentRate && totalAssets) {
    return { 
      fee: (percentRate / 100) * totalAssets,
      isEstimated: false
    };
  }
  
  // For percentage fee without current assets, try fallback logic
  if (feeType.toLowerCase() === 'percentage' && percentRate) {
    // No assets but we have payment history - try to find most recent AUM
    if (clientHistory?.payments && clientHistory.payments.length > 0) {
      // Sort payments by date descending
      const sortedPayments = [...clientHistory.payments]
        .filter(p => p.total_assets !== null && p.total_assets !== undefined)
        .sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());
      
      // Use the most recent AUM if available
      if (sortedPayments.length > 0 && sortedPayments[0].total_assets) {
        return {
          fee: (percentRate / 100) * sortedPayments[0].total_assets,
          isEstimated: true,
          message: `Based on last reported AUM of ${formatCurrency(sortedPayments[0].total_assets)}`
        };
      }
    }
    
    // No assets available anywhere
    return { 
      fee: null, 
      isEstimated: true, 
      message: 'Need AUM'
    };
  }
  
  // If we get here, we can't calculate
  return { fee: null, isEstimated: true };
}

// For mapping payment schedule to display labels
export function formatPaymentSchedule(schedule: string | undefined | null): string {
  if (!schedule) return 'N/A';
  
  switch (schedule.toLowerCase()) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    default:
      return schedule;
  }
}

// Display payment method in a standardized format
export function formatPaymentMethod(method: string | undefined | null): string {
  if (!method) return 'N/A';
  
  // Capitalize first letter of each word
  return method
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}