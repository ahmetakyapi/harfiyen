export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 py-8">
      <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} PROJECT_NAME — tüm hakları saklıdır
      </div>
    </footer>
  )
}
