import Link from "next/link";
import PostCard from "@/components/PostCard";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { countPosts, getPage, getPosts } from "@/lib/data";

const PER_PAGE = 12;

export async function generateMetadata() {
  const page = await getPage("nyheter");
  return { title: page?.title ?? "Nyheter", description: page?.intro ?? undefined };
}

export default async function NewsPage({ searchParams }: PageProps<"/nyheter">) {
  const { sida } = await searchParams;
  const current = Math.max(1, Number(Array.isArray(sida) ? sida[0] : sida) || 1);
  const [page, posts, total] = await Promise.all([
    getPage("nyheter"),
    getPosts(PER_PAGE, (current - 1) * PER_PAGE),
    countPosts(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader eyebrow="Från föreningen" title={page?.title ?? "Nyheter"} intro={page?.intro} image={page?.image} />
      <Container className="py-14 sm:py-20">
        {posts.length === 0 ? (
          <EmptyState title="Inga nyheter ännu" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => <PostCard key={p.id} post={p} variant={i} />)}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Sidor" className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {current > 1 && (
              <Link href={`/nyheter?sida=${current - 1}`} className="rounded-sm border border-[#ded3c2] bg-[#fbf9f5] px-4 py-2 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-warm shadow-sm hover:border-[#c5a059] hover:bg-white">
                ← Nyare
              </Link>
            )}
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 2)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-warm-muted">…</span>}
                  <Link
                    href={`/nyheter?sida=${n}`}
                    aria-current={n === current ? "page" : undefined}
                    className={`grid h-10 min-w-10 place-items-center rounded-sm font-serif text-sm font-semibold shadow-sm ${
                      n === current ? "border border-[#c5a059] bg-[#0d0f14] text-[#dfbe76]" : "border border-[#ded3c2] bg-[#fbf9f5] text-warm hover:border-[#c5a059]/60 hover:bg-white"
                    }`}
                  >
                    {n}
                  </Link>
                </span>
              ))}
            {current < pages && (
              <Link href={`/nyheter?sida=${current + 1}`} className="rounded-sm border border-[#ded3c2] bg-[#fbf9f5] px-4 py-2 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-warm shadow-sm hover:border-[#c5a059] hover:bg-white">
                Äldre →
              </Link>
            )}
          </nav>
        )}
      </Container>
    </>
  );
}
