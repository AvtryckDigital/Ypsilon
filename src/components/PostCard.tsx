import Link from "next/link";
import { dayOfMonth, formatDate, monthName, parseLocal, truncate } from "@/lib/format";
import type { Post } from "@/lib/types";

/** Omslag för inlägg utan bild: datumet stort i föreningens färger, i stället för en tom bildruta. */
function DateCover({ date }: { date: string; variant?: number }) {
  const p = parseLocal(date);
  return (
    <div className="relative flex aspect-[16/10] flex-col justify-end overflow-hidden border-b border-[#c5a059]/25 bg-[#0d0f14] p-6 text-[#fbf8f2]" aria-hidden>
      <span className="font-display text-7xl font-semibold leading-none text-[#dfbe76]">{dayOfMonth(date)}</span>
      {p && (
        <span className="mt-1 font-serif text-xl italic tracking-wider text-[#d6cdbd]">
          {monthName(p.m)} {p.y}
        </span>
      )}
    </div>
  );
}

export default function PostCard({ post, variant = 0 }: { post: Post; variant?: number }) {
  return (
    <article className="oxford-frame group relative flex flex-col overflow-hidden rounded-sm border border-[#ded3c2] bg-[#fbf9f5] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md">
      {post.cover ? (
        <div className="overflow-hidden border-b border-[#ded3c2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105" />
        </div>
      ) : (
        <DateCover date={post.published_at} variant={variant} />
      )}
      <div className="flex flex-1 flex-col p-6">
        {post.cover && (
          <time dateTime={post.published_at} className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6b2d]">
            {formatDate(post.published_at)}
          </time>
        )}
        <h3 className="mt-1.5 font-display text-[1.7rem] leading-tight text-warm transition-colors group-hover:text-[#8c6b2d]">
          <Link href={`/nyheter/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-3 text-[0.98rem] leading-relaxed text-warm-muted">{truncate(post.excerpt, 140)}</p>}
        <span className="mt-auto pt-5 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] group-hover:text-warm">
          Läs mer →
        </span>
      </div>
    </article>
  );
}
