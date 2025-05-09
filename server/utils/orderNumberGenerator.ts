/**
 * Generates a unique order number
 * Format: MVxxxxyyyymmdd
 * Where:
 * - MV is the prefix
 * - xxxx is a random 4-digit number
 * - yyyymmdd is the date (year, month, day)
 */
export function generateOrderNumber(): string {
  // Create date part (yyyymmdd)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  // Generate random 4-digit number
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Combine with prefix
  return `MV${randomPart}${datePart}`;
}