/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // İstemci router önbelleği dinamik sayfaları varsayılan 30 sn bayat tutar:
    // bulmaca bitirip ana sayfaya dönünce süre/durum eski görünüyordu ve ancak
    // sayfa yenilenince geliyordu. 0 = her istemci-içi geçişte taze RSC verisi.
    staleTimes: { dynamic: 0 },
  },
}

export default nextConfig
