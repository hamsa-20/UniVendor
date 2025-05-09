/**
 * Format a number as a currency value
 * 
 * @param value - The numeric value to format
 * @param currencyCode - The ISO currency code (default USD)
 * @param locale - The locale code to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currencyCode = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}