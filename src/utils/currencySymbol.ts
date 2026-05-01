/**
 * ISO 4217 → display symbol. Used to render `{{document.*_with_currency}}`
 * variables (e.g. `₹12,500.00`) so message bodies don't need to keep
 * `{{document.currency}}` and `{{document.total}}` adjacent — Meta rejects
 * back-to-back WhatsApp template variables.
 *
 * Codes not in this map fall back to the code itself.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'د.إ',
  SAR: 'ر.س',
  CHF: 'CHF',
  NZD: 'NZ$',
  HKD: 'HK$',
  ZAR: 'R',
  BRL: 'R$',
  MXN: 'Mex$',
  THB: '฿',
  KRW: '₩',
  RUB: '₽',
  TRY: '₺',
};

export function currencySymbol(code: string | undefined | null): string {
  if (!code) return '';
  const normalized = code.trim().toUpperCase();
  return CURRENCY_SYMBOLS[normalized] || code.trim();
}

export function formatAmountWithCurrency(
  amount: string | undefined | null,
  currencyCode: string | undefined | null,
): string {
  const value = (amount ?? '').toString().trim();
  const symbol = currencySymbol(currencyCode);
  if (!value && !symbol) return '';
  if (!symbol) return value;
  if (!value) return symbol;
  return `${symbol}${value}`;
}
