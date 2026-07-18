'use client'

import { useCallback } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

/**
 * Magnetic buton efekti — imleç yaklaştığında element çekilir.
 *
 * const { mx, my, onMove, onLeave } = useMagnetic(0.26)
 * <motion.button style={{ x: mx, y: my }} onMouseMove={onMove} onMouseLeave={onLeave} />
 */
export function useMagnetic(strength = 0.26) {
  const mx = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      mx.set((e.clientX - rect.left - rect.width / 2) * strength)
      my.set((e.clientY - rect.top - rect.height / 2) * strength)
    },
    [mx, my, strength],
  )

  const onLeave = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  return { mx, my, onMove, onLeave }
}
