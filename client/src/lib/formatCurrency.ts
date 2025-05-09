/**
 * Format a number as a currency value
 * 
 * @param value - The numeric value to format
 * @param currencyCode - The ISO currency code (default INR)
 * @param locale - The locale code to use for formatting (default: en-IN)
 * @param showDecimal - Whether to show decimal places (default: false for INR)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currencyCode = 'INR',
  locale = 'en-IN',
  showDecimal = false
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: showDecimal || currencyCode !== 'INR' ? 2 : 0,
    maximumFractionDigits: showDecimal || currencyCode !== 'INR' ? 2 : 0,
  }).format(value);
}

/**
 * Format a value for subscription pricing display
 * Shows the plan price with appropriate period suffix
 * 
 * @param value - The numeric value to format
 * @param period - The billing period ('monthly' or 'yearly')
 * @param currencyCode - The ISO currency code (default INR)
 * @returns Formatted price with period suffix
 */
export function formatSubscriptionPrice(
  value: number,
  period: 'monthly' | 'yearly' = 'monthly',
  currencyCode = 'INR'
): string {
  const formattedPrice = formatCurrency(value, currencyCode);
  const suffix = period === 'monthly' ? '/mon' : '/yr';
  return `${formattedPrice}${suffix}`;
}