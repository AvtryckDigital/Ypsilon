import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: [
    {
      path: "../fonts/cormorant-garamond-normal.woff2",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = localFont({
  src: [
    {
      path: "../fonts/source-sans-3-normal.woff2",
      style: "normal",
    },
    {
      path: "../fonts/source-sans-3-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-source-sans",
  display: "swap",
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
