import { KeyRound, Trash2, UserPlus } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SimpleForm from "@/components/admin/SimpleForm";
import { createUser, deleteUser, resetUserPassword } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export const metadata = { title: "Administratörer" };

export default async function UsersPage() {
  const me = await requireUser();
  const users = await all<{ id: number; email: string; name: string | null; created_at: string }>(
    "SELECT id, email, name, created_at FROM users ORDER BY email",
  );

  return (
    <>
      <AdminHeader
        title="Administratörer"
        description="Alla här kan logga in och ändra allt på hemsidan. När styrelsen byts: lägg till de nya och ta bort de som slutat."
      />

      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {users.map((u) => (
          <li key={u.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">
                  {u.name ?? u.email} {u.id === me.id && <span className="ml-1 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-gold-ink">Du</span>}
                </p>
                <p className="text-sm text-muted">{u.email} · tillagd {formatDate(u.created_at.slice(0, 10))}</p>
              </div>
              {u.id !== me.id && users.length > 1 && (
                <ConfirmButton action={deleteUser.bind(null, u.id)} message={`Ta bort ${u.email} som administratör?`}>
                  <Trash2 size={15} aria-hidden /> Ta bort
                </ConfirmButton>
              )}
            </div>
            {u.id !== me.id && (
              <details className="mt-3">
                <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-royal hover:text-navy">
                  <KeyRound size={14} aria-hidden /> Sätt nytt lösenord
                </summary>
                <div className="mt-3 max-w-sm">
                  <SimpleForm
                    action={resetUserPassword.bind(null, u.id)}
                    submitLabel="Spara lösenord"
                    fields={[{ name: "password", label: "Nytt lösenord", type: "password", autoComplete: "new-password", required: true, help: `Minst ${MIN_PASSWORD_LENGTH} tecken. Berätta det för personen, som sedan kan byta det under Mitt konto.` }]}
                  />
                </div>
              </details>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-10 max-w-lg rounded-lg border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 text-2xl text-navy"><UserPlus size={22} aria-hidden /> Lägg till administratör</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Ge personen e-postadressen och lösenordet. Hen kan själv byta lösenord efter inloggning.</p>
        <SimpleForm
          action={createUser}
          submitLabel="Lägg till"
          fields={[
            { name: "name", label: "Namn", autoComplete: "off" },
            { name: "email", label: "E-post", type: "email", required: true, autoComplete: "off" },
            { name: "password", label: "Lösenord", type: "password", required: true, autoComplete: "new-password", help: `Minst ${MIN_PASSWORD_LENGTH} tecken.` },
          ]}
        />
      </section>
    </>
  );
}
