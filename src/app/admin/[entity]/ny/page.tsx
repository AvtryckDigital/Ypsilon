import { notFound } from "next/navigation";
import AdminForm from "@/components/admin/AdminForm";
import AdminHeader from "@/components/admin/AdminHeader";
import { saveEntity } from "@/app/admin/actions";
import { getEntity } from "@/lib/admin/entities";
import { suggestionsFor } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth";
import { todayStockholm } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/admin/[entity]/ny">) {
  const { entity } = await params;
  const e = getEntity(entity);
  return { title: e ? `Lägg till ${e.singular}` : "Admin" };
}

export default async function NewEntity({ params }: PageProps<"/admin/[entity]/ny">) {
  await requireUser();
  const { entity: key } = await params;
  const entity = getEntity(key);
  if (!entity) notFound();

  // Rimliga förval för nya rader.
  const defaults: Record<string, string | number> = {};
  if (entity.key === "nyheter") defaults.published_at = todayStockholm();
  if (entity.key === "hedersypsor") defaults.year = Number(todayStockholm().slice(0, 4));

  return (
    <>
      <AdminHeader
        title={`Lägg till ${entity.singular}`}
        back={{ href: `/admin/${key}`, label: entity.label }}
        description={entity.key === "galleri" ? "Spara albumet först. Därefter kan du ladda upp bilderna." : undefined}
      />
      <AdminForm
        fields={entity.fields}
        values={defaults}
        action={saveEntity.bind(null, key, null)}
        submitLabel={entity.key === "galleri" ? "Skapa album och ladda upp bilder" : "Spara"}
        cancelHref={`/admin/${key}`}
        suggestions={await suggestionsFor(entity)}
      />
    </>
  );
}
