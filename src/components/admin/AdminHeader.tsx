import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export default function AdminHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-royal hover:text-navy">
          <ChevronLeft size={16} aria-hidden /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-navy">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
