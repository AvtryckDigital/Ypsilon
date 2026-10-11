import { Suspense } from "react";
import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import Flash from "@/components/admin/Flash";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s | Ypsilon admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  return (
    <div className="min-h-full bg-paper">
      <AdminNav email={user.email} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
      <Suspense>
        <Flash />
      </Suspense>
    </div>
  );
}
