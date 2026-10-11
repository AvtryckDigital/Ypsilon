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
      <AdminHeader title="Inställningar" description="Uppgifter som visas på flera ställen på hemsidan, till exempel i sidfoten." />
      <SettingsForm values={settings} />
    </>
  );
}
