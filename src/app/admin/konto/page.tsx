import AdminHeader from "@/components/admin/AdminHeader";
import SimpleForm from "@/components/admin/SimpleForm";
import { changePassword } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export const metadata = { title: "Mitt konto" };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <>
      <AdminHeader title="Mitt konto" description={`Inloggad som ${me.email}.`} />
      <section className="max-w-lg rounded-lg border border-line bg-white p-6">
        <h2 className="mb-4 text-2xl text-navy">Byt lösenord</h2>
        <SimpleForm
          action={changePassword}
          submitLabel="Byt lösenord"
          fields={[
            { name: "current", label: "Nuvarande lösenord", type: "password", autoComplete: "current-password", required: true },
            { name: "password", label: "Nytt lösenord", type: "password", autoComplete: "new-password", required: true, help: `Minst ${MIN_PASSWORD_LENGTH} tecken. Du loggas ut på dina andra enheter.` },
            { name: "repeat", label: "Upprepa nytt lösenord", type: "password", autoComplete: "new-password", required: true },
          ]}
        />
      </section>
    </>
  );
}
