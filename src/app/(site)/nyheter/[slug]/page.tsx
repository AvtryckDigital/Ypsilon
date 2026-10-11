import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, Container, Markdown, PageHeader } from "@/components/ui";
import { getAdjacentPosts, getPost } from "@/lib/data";
import { formatDate, stripMarkdown, truncate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/nyheter/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Nyheten finns inte" };
  return {
    title: post.title,
    description: post.excerpt ?? truncate(stripMarkdown(post.body ?? ""), 160),
    openGraph: post.cover ? { images: [post.cover] } : undefined,
  };
}

export default async function PostPage({ params }: PageProps<"/nyheter/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { newer, older } = await getAdjacentPosts(post);

  return (
    <article>
      <PageHeader
        eyebrow={[formatDate(post.published_at), post.author].filter(Boolean).join(" · ")}
        title={post.title}
        image={post.cover}
      />

      <Container className="max-w-3xl py-12 sm:py-16">
        <BackLink href="/nyheter">Alla nyheter</BackLink>
        <Markdown className="text-[1.1rem]">{post.body}</Markdown>

        <nav aria-label="Fler nyheter" className="mt-16 grid gap-4 border-t border-[#ded3c2] pt-8 sm:grid-cols-2">
          {newer ? (
            <Link
              href={`/nyheter/${newer.slug}`}
              className="oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md"
            >
              <span className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d]">← Nyare</span>
              <span className="mt-1 block font-display text-xl text-warm">{newer.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {older && (
            <Link
              href={`/nyheter/${older.slug}`}
              className="oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md"
            >
              <span className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d]">Äldre →</span>
              <span className="mt-1 block font-display text-xl text-warm">{older.title}</span>
            </Link>
          )}
        </nav>
      </Container>
    </article>
  );
}
