'use client'

import { motion } from 'framer-motion'
import { useSpotlight } from '@/hooks/useSpotlight'
import { fadeUp, staggerContainer } from '@/lib/variants'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/CustomCursor'

export default function Home() {
  const spotlight = useSpotlight()

  return (
    <>
      <CustomCursor />
      <Header />

      <main className="relative min-h-screen overflow-hidden">
        {/* Spotlight overlay */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: spotlight }}
        />

        {/* Hero */}
        <section className="relative z-10 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-6 flex justify-center">
              <span className="chip">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Projeye hoş geldin
              </span>
            </motion.div>

            {/* Başlık */}
            <motion.h1
              variants={fadeUp}
              className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-100 dark:text-slate-100 sm:text-6xl"
            >
              PROJECT_NAME{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
                başladı
              </span>
            </motion.h1>

            {/* Alt yazı */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-slate-400"
            >
              PROJECT_DESCRIPTION
            </motion.p>

            {/* CTA Butonları */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95">
                Başla
              </button>
              <button className="glass rounded-xl px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:text-white active:scale-95">
                Daha Fazla
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Cards */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="glass rounded-2xl p-6"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-slate-100">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  )
}

const FEATURES = [
  {
    icon: '⚡',
    title: 'Hızlı Başlangıç',
    desc: 'Next.js 14 App Router, Tailwind CSS ve Drizzle ORM ile hazır.',
  },
  {
    icon: '🎨',
    title: 'Tema Sistemi',
    desc: 'Dark/light mode, glassmorphism ve tutarlı animasyon sistemi.',
  },
  {
    icon: '🗄️',
    title: 'Veritabanı Hazır',
    desc: 'Neon Postgres + Drizzle ORM — serverless için optimize.',
  },
]
