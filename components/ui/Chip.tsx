import { cn } from '@/lib/utils'

interface ChipProps {
  children: React.ReactNode
  className?: string
  dot?: string  // dot rengi (Tailwind class — 'bg-emerald-400', 'bg-indigo-400' vb.)
}

/**
 * Pill/chip badge bileşeni.
 * dot prop'u ile renkli nokta eklenebilir.
 *
 * <Chip dot="bg-emerald-400">Yeni özellik</Chip>
 */
export function Chip({ children, className, dot }: ChipProps) {
  return (
    <span className={cn('chip', className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}
