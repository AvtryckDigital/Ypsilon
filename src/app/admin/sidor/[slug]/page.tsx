import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import AdminForm from "@/components/admin/AdminForm";
import AdminHeader from "@/components/admin/AdminHeader";
import { savePage } from "@/app/admin/actions";
import { PAGE_FIELDS, PAGES } from "@/lib/admin/site";
import { requireUser } from "@/lib/auth";
import { getPage } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/admin/sidor/[slug]">) {
  const { slug } = await params;
  return { title: PAGES.find((p) => p.slug === slug)?.label ?? "Sida" };
}

export default async function EditPage({ params }: PageProps<"/admin/sidor/[slug]">) {
  await requireUser();
  const { slug } = await params;
  const def = PAGES.find((p) => p.slug === slug);
  if (!def) notFound();
  const page = await getPage(slug);
  const fields = (def.usesBody ? PAGE_FIELDS : PAGE_FIELDS.filter((f) => f.name === "title" || f.name === "intro")).filter(
    (f) => f.name !== "image" || def.usesImage !== false,
  );

  return (
    <>
      <AdminHeader
        title={def.label}
        description={def.note}
        back={{ href: "/admin/sidor", label: "Sidor och texter" }}
        actions={
          <a href={def.path} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary">
            <ExternalLink size={16} aria-hidden /> Visa på hemsidan
          </a>
        }
      />
      <AdminForm
        fields={fields}
        values={page ?? { title: def.label }}
        action={savePage.bind(null, slug)}
        cancelHref="/admin/sidor"
      />
    </>
  );
}
