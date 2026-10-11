import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Viewport } from "next";

// Allt innehåll hämtas från databasen vid varje sidvisning,
// så ändringar i admin syns direkt utan ny publicering.
export const dynamic = "force-dynamic";

// Webbläsarens adressfält i samma färg som headern
export const viewport: Viewport = {
  themeColor: "#0d0f14",
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#innehall"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Hoppa till innehållet
      </a>
      <div data-site className="flex min-h-full flex-1 flex-col bg-midnight text-warm">
        <Header />
        <main id="innehall" className="flex-1 bg-ivory">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
