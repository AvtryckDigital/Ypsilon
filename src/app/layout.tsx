import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ypsa.se"),
  title: {
    default: "Ypsilon – Till glädje och prydnad för Norrlands nation sedan 1962",
    template: "%s | Ypsilon",
  },
  description:
    "Ypsilon är Norrlands nations äldsta damförening i Uppsala, grundad 1962. Yror, sittningar, Älggasquen och gemenskap för studentskor från hela Sverige.",
  openGraph: {
    siteName: "Ypsilon",
    locale: "sv_SE",
    type: "website",
    images: ["/brand/vapen-1200.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#030972",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
