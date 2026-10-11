"use client";

import { saveSettings } from "@/app/admin/actions";
import { SETTINGS_GROUPS } from "@/lib/admin/site";
import AdminForm from "./AdminForm";

// Inställningarna visas i grupper men skickas som ett enda formulär.
export default function SettingsForm({ values }: { values: Record<string, string> }) {
  const fields = SETTINGS_GROUPS.flatMap((g) =>
    g.fields.map((f, i) => (i === 0 ? { ...f, group: g.title, groupDescription: g.description } : f)),
  );
  return <AdminForm fields={fields} values={values} action={saveSettings} submitLabel="Spara inställningar" />;
}
