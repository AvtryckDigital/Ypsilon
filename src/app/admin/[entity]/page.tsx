import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, ImageOff, Pencil, Plus, Search } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { moveEntity } from "@/app/admin/actions";
import { getEntity } from "@/lib/admin/entities";
import type { ListColumn } from "@/lib/admin/fields";
import { listRows, type AdminRow } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth";
import { formatDate, formatTime, truncate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/admin/[entity]">) {
  const { entity } = await params;
  return { title: getEntity(entity)?.label ?? "Admin" };
}

const KIND_LABEL: Record<string, string> = { yra: "Extra viktigt", vanlig: "Vanligt", extern: "Tips" };

function Cell({ col, row }: { col: ListColumn; row: AdminRow }) {
  const v = row[col.name];
  switch (col.format) {
    case "date":
      return <>{formatDate(v as string)}</>;
    case "datetime":
      return <span className="whitespace-nowrap">{formatDate(v as string)} <span className="text-muted">{formatTime(v as string)}</span></span>;
    case "boolean":
      return Number(v) === 1
        ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Ja</span>
        : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Utkast</span>;
    case "kind":
      return v === "yra"
        ? <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-navy-deep">Extra viktigt</span>
        : <span className="text-muted">{KIND_LABEL[String(v)] ?? ""}</span>;
    case "image":
      return v ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(v)} alt="" className="h-10 w-12 rounded object-cover" />
      ) : (
        <span className="grid h-10 w-12 place-items-center rounded bg-cream text-muted"><ImageOff size={16} aria-hidden /></span>
      );
    default:
      return <>{v === null || v === undefined ? "" : truncate(String(v), 70)}</>;
  }
}

export default async function EntityList({ params, searchParams }: PageProps<"/admin/[entity]">) {
  await requireUser();
  const { entity: key } = await params;
  const entity = getEntity(key);
  if (!entity) notFound();

  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.sida) || 1);
  const { rows, total, pages } = await listRows(entity, q, page);
  const canMove = entity.sortable && !q;

  const pageLink = (n: number) => `/admin/${key}?${new URLSearchParams({ ...(q ? { q } : {}), sida: String(n) })}`;

  return (
    <>
      <AdminHeader
        title={entity.label}
        description={entity.description}
        actions={
          <Link href={`/admin/${key}/ny`} className="admin-btn-primary">
            <Plus size={18} aria-hidden /> Lägg till {entity.singular}
          </Link>
        }
      />

      {entity.search && (total > 8 || q) && (
        <form className="mb-5 flex gap-2" role="search">
          <label className="relative flex-1">
            <span className="sr-only">Sök</span>
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              placeholder={`Sök bland ${entity.label.toLowerCase()}…`}
              className="w-full rounded-md border border-line bg-white py-2.5 pl-10 pr-3 outline-none focus:border-royal focus:ring-2 focus:ring-royal/15"
            />
          </label>
          <button className="admin-btn-secondary">Sök</button>
          {q && <Link href={`/admin/${key}`} className="admin-btn-secondary">Rensa</Link>}
        </form>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-2xl text-navy">{q ? "Inget matchade sökningen" : `Inga ${entity.label.toLowerCase()} ännu`}</p>
          {!q && (
            <Link href={`/admin/${key}/ny`} className="admin-btn-primary mt-4">
              <Plus size={18} aria-hidden /> Lägg till {entity.singular}
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-[0.97rem]">
            <thead className="border-b border-line bg-paper text-sm text-muted">
              <tr>
                {entity.columns.map((c) => (
                  <th key={c.name} scope="col" className="px-4 py-3 font-semibold">{c.label}</th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-semibold"><span className="sr-only">Åtgärder</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, i) => {
                const id = Number(row.id);
                return (
                  <tr key={id} className="hover:bg-cream/30">
                    {entity.columns.map((c) => (
                      <td key={c.name} className="px-4 py-2.5 align-middle">
                        {c.name === entity.titleColumn ? (
                          <Link href={`/admin/${key}/${id}`} className="font-semibold text-navy hover:text-royal hover:underline">
                            <Cell col={c} row={row} />
                          </Link>
                        ) : (
                          <Cell col={c} row={row} />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canMove && (
                          <>
                            <form action={moveEntity.bind(null, key, id, "up")}>
                              <button disabled={i === 0 && page === 1} className="rounded p-2 text-muted hover:bg-cream hover:text-navy disabled:invisible" aria-label="Flytta upp" title="Flytta upp">
                                <ArrowUp size={16} />
                              </button>
                            </form>
                            <form action={moveEntity.bind(null, key, id, "down")}>
                              <button disabled={page === pages && i === rows.length - 1} className="rounded p-2 text-muted hover:bg-cream hover:text-navy disabled:invisible" aria-label="Flytta ner" title="Flytta ner">
                                <ArrowDown size={16} />
                              </button>
                            </form>
                          </>
                        )}
                        {entity.publicPath && (
                          <a href={entity.publicPath(row)} target="_blank" rel="noopener noreferrer" className="rounded p-2 text-muted hover:bg-cream hover:text-navy" aria-label="Visa på hemsidan" title="Visa på hemsidan">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <Link href={`/admin/${key}/${id}`} className="rounded p-2 text-muted hover:bg-cream hover:text-navy" aria-label="Ändra" title="Ändra">
                          <Pencil size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Sidor" className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted">{total} st · sida {page} av {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageLink(page - 1)} className="admin-btn-secondary">← Föregående</Link>}
            {page < pages && <Link href={pageLink(page + 1)} className="admin-btn-secondary">Nästa →</Link>}
          </div>
        </nav>
      )}
    </>
  );
}
