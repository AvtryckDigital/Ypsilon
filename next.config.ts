import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Ger `next dev` tillgång till D1 (databasen) och R2 (bilderna) lokalt,
// enligt bindningarna i wrangler.jsonc.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Bilder skalas ner vid uppladdning och serveras direkt från R2,
  // så Next.js egen bildoptimering behövs inte.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Gamla WordPress-adresser pekas om så att länkar och sökträffar fortsätter fungera.
  async redirects() {
    return [
      { source: "/about", destination: "/om-ypsilon", permanent: true },
      { source: "/kontakt-2", destination: "/kontakt", permanent: true },
      { source: "/kontakt-2/medlemsregister", destination: "/gammal-medlem", permanent: true },
      { source: "/styrelsen/overypsor", destination: "/overypsor", permanent: true },
      { source: "/foton", destination: "/galleri", permanent: true },
      { source: "/foton/:path*", destination: "/galleri", permanent: true },
      { source: "/category/:path*", destination: "/nyheter", permanent: true },
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:slug",
        destination: "/nyheter/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
