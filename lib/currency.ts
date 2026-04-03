export type Currency = 'PKR' | 'USD';

const FALLBACK_USD_RATE = 278;

export const USD_RATE = Number(process.env.NEXT_PUBLIC_USD_RATE) || FALLBACK_USD_RATE;

export function convertPrice(amountPKR: number, currency: Currency): number {
  if (currency === 'PKR') {
    return amountPKR;
  }

  return Number((amountPKR / USD_RATE).toFixed(2));
}

export function formatPrice(amountPKR: number, currency: Currency): string {
  const value = convertPrice(amountPKR, currency);

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value);
  }

  return `${new Intl.NumberFormat('en-PK').format(value)} PKR`;
}
