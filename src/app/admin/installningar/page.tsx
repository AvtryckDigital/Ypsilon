import AdminHeader from "@/components/admin/AdminHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Inställningar" };

export default async function SettingsPage() {
  await requireUser();
  const settings = await getSettings();
  return (
    <>
      <AdminHeader
        title="Inställningar"
        description="Gemensamma uppgifter som visas på flera sidor, t.ex. i sidfoten (footer) och kontaktuppgifter."
      />
      <SettingsForm values={settings} />
    </>
  );
}
