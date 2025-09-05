/**
 * Currency utility functions for CAD formatting
 */

export const CURRENCY_CODE = 'CAD';
export const CURRENCY_SYMBOL = 'C$';

/**
 * Format a number as CAD currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCAD = (
  amount: number | string,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showSymbol ? `${CURRENCY_SYMBOL}0.00` : '0.00';
  }

  const formatted = numAmount.toFixed(maximumFractionDigits);
  
  if (showCode) {
    return `${formatted} ${CURRENCY_CODE}`;
  }
  
  if (showSymbol) {
    return `${CURRENCY_SYMBOL}${formatted}`;
  }
  
  return formatted;
};

/**
 * Format currency using browser's Intl.NumberFormat for CAD
 * @param amount - The amount to format
 * @param locale - The locale to use (defaults to 'en-CA')
 * @returns Formatted currency string
 */
export const formatCADIntl = (
  amount: number | string,
  locale: string = 'en-CA'
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CURRENCY_CODE,
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY_CODE,
  }).format(numAmount);
};

/**
 * Parse a currency string and return the numeric value
 * @param currencyString - The currency string to parse
 * @returns The numeric value
 */
export const parseCAD = (currencyString: string): number => {
  // Remove currency symbols and codes
  const cleaned = currencyString
    .replace(/[C$CAD\s,]/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
