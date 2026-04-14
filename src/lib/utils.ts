import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMAD(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(num);
}

export function formatNumber(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('fr-MA').format(num);
}

export function formatDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('fr-MA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function generateOrderNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${y}-${r}`;
}

export function calculateTVA(ht: number, rate = 0.20) {
  const tva = ht * rate;
  return { ht, tva, ttc: ht + tva };
}
