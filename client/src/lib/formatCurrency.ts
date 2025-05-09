/**
 * Format a number as currency in Indian Rupees (INR)
 * @param amount - The amount to format
 * @param currency - The currency code, defaults to INR
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}