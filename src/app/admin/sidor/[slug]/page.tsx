import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import AdminForm from "@/components/admin/AdminForm";
import AdminHeader from "@/components/admin/AdminHeader";
import { savePage } from "@/app/admin/actions";
import { getPageFields, PAGES } from "@/lib/admin/site";
import { requireUser } from "@/lib/auth";
import { getPage, getSettings } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/admin/sidor/[slug]">) {
  const { slug } = await params;
  return { title: PAGES.find((p) => p.slug === slug)?.label ?? "Sida" };
}

export default async function EditPage({ params }: PageProps<"/admin/sidor/[slug]">) {
  await requireUser();
  const { slug } = await params;
  const def = PAGES.find((p) => p.slug === slug);
  if (!def) notFound();
  const [page, settings] = await Promise.all([getPage(slug), getSettings()]);
  const fields = getPageFields(def);

  const values: Record<string, string | number | null | undefined> = {
    ...settings,
    ...(page ?? {}),
    title: page?.title ?? def.label,
    home_tagline: settings.home_tagline || settings.tagline || "",
  };

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
        values={values}
        action={savePage.bind(null, slug)}
        cancelHref="/admin/sidor"
      />
    </>
  );
}
