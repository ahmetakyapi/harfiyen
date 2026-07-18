'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Custom cursor — nokta (direkt) + yavaş halka (spring).
 * Sadece pointer:fine (desktop) cihazlarda render edilir.
 * Kaynak: ahmetakyapi.com
 */
export default function CustomCursor() {
  const [mounted, setMounted]  = useState(false)
  const [visible, setVisible]  = useState(false)
  const [isHover, setIsHover]  = useState(false)
  const [isPress, setIsPress]  = useState(false)
  const [isTouch, setIsTouch]  = useState(false)

  const dotX = useMotionValue(-200)
  const dotY = useMotionValue(-200)
  const ringX = useSpring(dotX, { stiffness: 140, damping: 16 })
  const ringY = useSpring(dotY, { stiffness: 140, damping: 16 })

  const onHoverStart = useCallback((e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('a,button,[role="button"],[data-cursor="pointer"]'))
      setIsHover(true)
    else setIsHover(false)
  }, [])

  useEffect(() => {
    setMounted(true)
    if (window.matchMedia('(pointer: coarse)').matches) { setIsTouch(true); return }

    const onMove  = (e: MouseEvent) => { dotX.set(e.clientX); dotY.set(e.clientY); setVisible(true) }
    const onDown  = () => setIsPress(true)
    const onUp    = () => setIsPress(false)
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousemove', onHoverStart)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousemove', onHoverStart)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
    }
  }, [dotX, dotY, onHoverStart])

  if (!mounted || isTouch) return null

  return (
    <>
      {/* Nokta */}
      <motion.div
        className="pointer-events-none fixed z-[9999] rounded-full bg-sky-400"
        style={{
          x: dotX, y: dotY,
          width: isPress ? 6 : 8, height: isPress ? 6 : 8,
          translateX: '-50%', translateY: '-50%',
          opacity: visible ? 1 : 0,
          transition: 'width 0.1s, height 0.1s, opacity 0.2s',
          mixBlendMode: 'difference',
        }}
      />
      {/* Halka */}
      <motion.div
        className="pointer-events-none fixed z-[9998] rounded-full border border-sky-400/40"
        style={{
          x: ringX, y: ringY,
          width:  isHover ? 40 : isPress ? 28 : 32,
          height: isHover ? 40 : isPress ? 28 : 32,
          translateX: '-50%', translateY: '-50%',
          opacity: visible ? 0.6 : 0,
          transition: 'width 0.2s, height 0.2s, opacity 0.2s',
        }}
      />
    </>
  )
}
