/**
 * Converts USD to INR and formats as a price string with Indian Rupee symbol
 * @param usdPrice - The price in USD to convert and format
 * @returns Formatted price string with ₹ symbol and Indian number format
 */
export const formatPrice = (usdPrice: number): string => {
  // Convert USD to INR (approximate conversion rate, you might want to use a real-time rate in production)
  const USD_TO_INR = 83.50; // As of knowledge cutoff, 1 USD ≈ 83.50 INR
  const inrPrice = usdPrice * USD_TO_INR;
  
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
