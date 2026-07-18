import { cn } from '@/lib/utils'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useCallback } from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  tilt?: boolean    // 3D eğim efekti
  glow?: boolean    // Holografik parlaklık
}

/**
 * Glassmorphism kart bileşeni.
 * tilt=true → 3D eğim + holografik parlaklık efekti (ahmetakyapi.com Projects kartı)
 */
export function GlassCard({ children, className, tilt = false, glow = false }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const ry = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!tilt || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8)
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8)
    mouseX.set((e.clientX - r.left) / r.width)
    mouseY.set((e.clientY - r.top) / r.height)
  }, [tilt, rx, ry, mouseX, mouseY])

  const onLeave = useCallback(() => {
    rx.set(0); ry.set(0)
    mouseX.set(0.5); mouseY.set(0.5)
  }, [rx, ry, mouseX, mouseY])

  const shineX = useTransform(mouseX, [0, 1], ['0%', '100%'])
  const shineY = useTransform(mouseY, [0, 1], ['0%', '100%'])
  const shine  = useMotionTemplate`radial-gradient(400px circle at ${shineX} ${shineY}, rgba(99,102,241,0.12), rgba(139,92,246,0.06), transparent 70%)`

  return (
    <motion.div
      ref={ref}
      style={tilt ? { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' } : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('glass relative rounded-2xl overflow-hidden', className)}
    >
      {(tilt || glow) && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: shine }}
        />
      )}
      {children}
    </motion.div>
  )
}
