import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind class birleştirici — clsx + twMerge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Tarihi formatla: "15 Mart 2026" */
export function formatDate(date: Date | string, locale = 'tr-TR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/** Metni kısalt */
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}
