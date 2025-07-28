/**
 * Formats a price in INR with Indian Rupee symbol and Indian number format
 * @param inrPrice - The price in INR to format
 * @returns Formatted price string with ₹ symbol and Indian number format
 */
export const formatPrice = (inrPrice: number): string => {
  // Format number with Indian numbering system (lakhs and crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // Format the price and ensure it uses the ₹ symbol
  return formatter.format(inrPrice).replace('INR', '₹').trim();
};

/**
 * Formats a number to show in a shortened format (e.g., 1.2k, 3.4m)
 * @param num - The number to format
 * @returns Formatted string
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};
