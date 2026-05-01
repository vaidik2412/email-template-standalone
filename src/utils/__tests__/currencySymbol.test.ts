import { describe, expect, it } from 'vitest';

import { currencySymbol, formatAmountWithCurrency } from '../currencySymbol';

describe('currencySymbol', () => {
  it('maps known ISO codes to display symbols', () => {
    expect(currencySymbol('INR')).toBe('₹');
    expect(currencySymbol('usd')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
  });

  it('falls back to the original code when unknown', () => {
    expect(currencySymbol('XYZ')).toBe('XYZ');
  });

  it('returns empty string for missing input', () => {
    expect(currencySymbol(undefined)).toBe('');
    expect(currencySymbol('')).toBe('');
  });
});

describe('formatAmountWithCurrency', () => {
  it('prefixes the symbol against the amount with no separator', () => {
    expect(formatAmountWithCurrency('12,500.00', 'INR')).toBe('₹12,500.00');
    expect(formatAmountWithCurrency('99.00', 'USD')).toBe('$99.00');
  });

  it('returns the amount alone when the currency is missing', () => {
    expect(formatAmountWithCurrency('12,500.00', '')).toBe('12,500.00');
  });

  it('returns the symbol alone when the amount is missing', () => {
    expect(formatAmountWithCurrency('', 'INR')).toBe('₹');
  });
});
