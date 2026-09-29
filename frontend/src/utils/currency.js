export const currencySymbols = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export const formatMoney = (amount, currencyCode = 'INR') => {
  const code = currencyCode || 'INR';
  const symbol = currencySymbols[code] || '₹';
  
  try {
    if (code === 'INR') {
      return symbol + Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return symbol + Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (e) {
    // Safe fallback if toLocaleString fails
    return symbol + Number(amount).toFixed(2);
  }
};
