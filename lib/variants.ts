/**
 * Framer Motion Animasyon Varyantları
 * Kaynak: @ahmetakyapi/ui — tüm projelerde ortak
 */

export const EASE = [0.22, 1, 0.36, 1] as const

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
}

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const fadeUpLarge = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const fadeLeft = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
}

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
}

export const staggerContainer = (stagger = 0.12) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: stagger } },
})

export const slideDown = {
  hidden:  { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.2, ease: EASE } },
  exit:    { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
}

export const modalBackdrop = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const modalPanel = {
  hidden:  { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.25, ease: EASE } },
  exit:    { opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.15 } },
}
