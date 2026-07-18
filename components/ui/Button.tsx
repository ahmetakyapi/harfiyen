'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useMagnetic } from '@/hooks/useMagnetic'

type Variant = 'primary' | 'ghost' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  magnetic?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-indigo-500/40',
  ghost:   'glass text-slate-300 hover:text-white',
  outline: 'border border-slate-600/60 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-300',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const { mx, my, onMove, onLeave } = useMagnetic(0.26)

  if (magnetic) {
    return (
      <motion.button
        style={{ x: mx, y: my }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'rounded-xl font-semibold transition-all active:scale-95',
          variants[variant],
          sizes[size],
          className,
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <button
      className={cn(
        'rounded-xl font-semibold transition-all active:scale-95',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
