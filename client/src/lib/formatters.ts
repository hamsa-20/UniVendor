/**
 * Format a number as currency
 * @param amount - The number to format
 * @param currency - Currency code (default: INR)
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, currency = 'INR', locale = 'en-IN'): string {
  if (amount === null || amount === undefined) return '—';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '—';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format a date string or Date object
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, locale = 'en-IN'): string {
  if (!date) return '—';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a date with time
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date, locale = 'en-IN'): string {
  if (!date) return '—';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format a percentage value
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string with % symbol
 */
export function formatPercentage(value: number, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  
  return value.toFixed(decimals) + '%';
}

/**
 * Format a number with thousand separators
 * @param number - The number to format
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted number string
 */
export function formatNumber(number: number, locale = 'en-IN'): string {
  if (number === null || number === undefined) return '—';
  
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Truncate a string if it exceeds the maximum length
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncating (default: 50)
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength = 50, suffix = '...'): string {
  if (!str) return '';
  
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength) + suffix;
}