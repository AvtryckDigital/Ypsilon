import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Logga in", robots: { index: false } };

export default async function LoginPage() {
  if (await getUser()) redirect("/admin");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-cream/60">
      <div className="ribbon" aria-hidden />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/band.png" alt="" className="mx-auto h-16 w-auto" />
            <h1 className="mt-4 text-5xl text-navy">Ypsilon</h1>
            <p className="eyebrow mt-2">Inloggning för styrelsen</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-7 shadow-sm">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Glömt lösenordet? Be någon annan i styrelsen att skapa ett nytt konto åt dig under Administratörer.
          </p>
          <p className="mt-3 text-center">
            <Link href="/" className="text-sm font-semibold text-royal hover:text-navy">← Till hemsidan</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
