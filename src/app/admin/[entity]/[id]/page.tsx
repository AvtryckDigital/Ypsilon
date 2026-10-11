import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import AdminForm from "@/components/admin/AdminForm";
import AdminHeader from "@/components/admin/AdminHeader";
import AlbumImages from "@/components/admin/AlbumImages";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteEntity, saveEntity } from "@/app/admin/actions";
import { getEntity } from "@/lib/admin/entities";
import { getRow, suggestionsFor } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { AlbumImage } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity } = await params;
  const e = getEntity(entity);
  return { title: e ? `Ändra ${e.singular}` : "Admin" };
}

export default async function EditEntity({ params }: PageProps<"/admin/[entity]/[id]">) {
  await requireUser();
  const { entity: key, id: idParam } = await params;
  const entity = getEntity(key);
  const id = Number(idParam);
  if (!entity || !Number.isInteger(id)) notFound();
  const row = await getRow(entity, id);
  if (!row) notFound();

  const title = String(row[entity.titleColumn] ?? entity.singular);
  const images =
    entity.key === "galleri"
      ? await all<AlbumImage>("SELECT * FROM album_images WHERE album_id = ? ORDER BY sort_order, id", id)
      : null;

  const deleteMessage =
    entity.key === "galleri"
      ? `Ta bort albumet ”${title}” och alla ${images?.length ?? 0} bilder? Det går inte att ångra.`
      : `Ta bort ”${title}”? Det går inte att ångra.`;

  return (
    <>
      <AdminHeader
        title={title}
        back={{ href: `/admin/${key}`, label: entity.label }}
        actions={
          <>
            {entity.publicPath && (
              <a href={entity.publicPath(row)} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary">
                <ExternalLink size={16} aria-hidden /> Visa på hemsidan
              </a>
            )}
            <ConfirmButton action={deleteEntity.bind(null, key, id)} message={deleteMessage}>
              <Trash2 size={16} aria-hidden /> Ta bort
            </ConfirmButton>
          </>
        }
      />

      {images && (
        <section aria-labelledby="bilder" className="mb-12">
          <h2 id="bilder" className="mb-1 text-2xl text-navy">Bilder</h2>
          <p className="mb-4 text-muted">Välj flera bilder på en gång. De förminskas automatiskt innan de laddas upp.</p>
          <AlbumImages albumId={id} images={images} cover={(row.cover as string | null) ?? null} />
        </section>
      )}

      <section aria-labelledby="uppgifter">
        {images && <h2 id="uppgifter" className="mb-4 text-2xl text-navy">Om albumet</h2>}
        <AdminForm
          key={String(row.cover ?? "")}
          fields={entity.fields}
          values={row}
          action={saveEntity.bind(null, key, id)}
          cancelHref={`/admin/${key}`}
          suggestions={await suggestionsFor(entity)}
        />
      </section>
    </>
  );
}
