/**
 * @jest-environment jsdom
 */

import { 
  formatDate, 
  formatCurrency, 
  formatAmount, 
  formatPercent,
  getStatusClass,
  calculateExpectedFee,
  formatPaymentSchedule,
  formatPaymentMethod
} from '../utils/formatters';

describe('Date Formatters', () => {
  test('formatDate should format dates correctly', () => {
    // Use a mock date object that won't be affected by timezone differences
    const mockDate = new Date(2025, 2, 26); // March 26, 2025
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    expect(formatDate('2025-03-26')).toBe('March 26, 2025');
    
    // Restore original Date
    jest.restoreAllMocks();
  });

  test('formatDate should handle null and undefined', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });

  test('formatDate should handle invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });
});

describe('Currency and Number Formatters', () => {
  test('formatCurrency should format numbers as currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('formatCurrency should handle null and undefined', () => {
    expect(formatCurrency(null)).toBe('N/A');
    expect(formatCurrency(undefined)).toBe('N/A');
  });

  test('formatAmount should format numbers with appropriate precision', () => {
    expect(formatAmount(1234)).toBe('1,234');
    expect(formatAmount(1234.56)).toBe('1,234.56');
    expect(formatAmount(1234.00)).toBe('1,234');
  });

  test('formatPercent should format numbers as percentages', () => {
    expect(formatPercent(75)).toBe('75.00%');
    expect(formatPercent(0.5)).toBe('0.50%');
  });
});

describe('Status Formatters', () => {
  test('getStatusClass should return appropriate classes for statuses', () => {
    expect(getStatusClass('Paid')).toContain('text-green');
    expect(getStatusClass('PAID')).toContain('text-green');
    expect(getStatusClass('Unpaid')).toContain('text-red');
    expect(getStatusClass('Due')).toContain('text-red');
    expect(getStatusClass('Other')).toContain('text-gray');
  });
});

describe('Fee Calculators', () => {
  test('calculateExpectedFee should handle flat fees', () => {
    const result = calculateExpectedFee('Flat', 1000, null, null);
    expect(result.fee).toBe(1000);
    expect(result.isEstimated).toBe(false);
  });

  test('calculateExpectedFee should handle percentage fees', () => {
    const result = calculateExpectedFee('Percentage', null, 0.5, 200000);
    expect(result.fee).toBe(1000); // 0.5% of 200,000
    expect(result.isEstimated).toBe(false);
  });

  test('calculateExpectedFee should handle missing assets for percentage fees', () => {
    const result = calculateExpectedFee('Percentage', null, 0.5, null);
    expect(result.fee).toBe(null);
    expect(result.isEstimated).toBe(true);
  });

  test('calculateExpectedFee should handle missing fee type', () => {
    const result = calculateExpectedFee(null, 1000, 0.5, 200000);
    expect(result.fee).toBe(null);
    expect(result.isEstimated).toBe(false);
  });
});

describe('Label Formatters', () => {
  test('formatPaymentSchedule should format payment schedules correctly', () => {
    expect(formatPaymentSchedule('monthly')).toBe('Monthly');
    expect(formatPaymentSchedule('quarterly')).toBe('Quarterly');
    expect(formatPaymentSchedule('custom')).toBe('custom');
  });

  test('formatPaymentSchedule should handle null and undefined', () => {
    expect(formatPaymentSchedule(null)).toBe('N/A');
    expect(formatPaymentSchedule(undefined)).toBe('N/A');
  });

  test('formatPaymentMethod should capitalize payment methods', () => {
    expect(formatPaymentMethod('wire transfer')).toBe('Wire Transfer');
    expect(formatPaymentMethod('CHECK')).toBe('Check');
    expect(formatPaymentMethod('electronic payment')).toBe('Electronic Payment');
  });

  test('formatPaymentMethod should handle null and undefined', () => {
    expect(formatPaymentMethod(null)).toBe('N/A');
    expect(formatPaymentMethod(undefined)).toBe('N/A');
  });
});