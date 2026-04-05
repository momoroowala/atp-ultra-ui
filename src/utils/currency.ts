export const getCurrencySymbol = (currency: string = 'USD'): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
  };
  return symbols[currency] || '$';
};

export const formatCurrency = (amount: number, currency: string = 'USD', compact: boolean = false): string => {
  const symbol = getCurrencySymbol(currency);
  const absAmount = Math.abs(amount);
  
  // For compact mode, format large numbers with 'k'
  if (compact && absAmount >= 1000) {
    const abbreviated = absAmount / 1000;
    return `${symbol}${abbreviated.toFixed(abbreviated % 1 === 0 ? 0 : 1)}k`;
  }
  
  const formattedAmount = Math.round(absAmount).toLocaleString('en-US');
  return `${symbol}${formattedAmount}`;
};
