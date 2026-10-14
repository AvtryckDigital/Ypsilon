import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { PAGES } from "@/lib/admin/site";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export const metadata = { title: "Sidor och texter" };

export default async function PagesAdmin() {
  await requireUser();
  const rows = await all<{ slug: string; title: string; updated_at: string }>("SELECT slug, title, updated_at FROM pages");
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));

  return (
    <>
      <AdminHeader
        title="Sidor och texter"
        description="Rubriker, bilder och texter på hemsidans sidor. Klicka på en sida för att ändra dess innehåll."
      />
      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {PAGES.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/sidor/${p.slug}`} className="font-semibold text-navy hover:text-royal hover:underline">{p.label}</Link>
              <p className="text-sm text-muted">
                {bySlug[p.slug]?.title ?? "Inte skapad ännu"} · <span className="font-mono text-xs">{p.path}</span>
              </p>
            </div>
            <a href={p.path} target="_blank" rel="noopener noreferrer" className="rounded p-2 text-muted hover:bg-cream hover:text-navy" aria-label={`Visa ${p.label} på hemsidan`} title="Visa på hemsidan">
              <ExternalLink size={16} />
            </a>
            <Link href={`/admin/sidor/${p.slug}`} className="admin-btn-secondary"><Pencil size={15} aria-hidden /> Ändra</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
