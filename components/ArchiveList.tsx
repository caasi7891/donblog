"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PostMetadata } from "@/lib/mdx";

const badgeColors: Record<string, string> = {
  dev: "bg-primary-container/20 text-on-primary-container border-primary-container/30",
  trading: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
  travel: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
};
const titleHoverColors: Record<string, string> = {
  dev: "group-hover:text-primary",
  trading: "group-hover:text-secondary",
  travel: "group-hover:text-tertiary",
};

export function ArchiveList({ posts }: { posts: PostMetadata[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const q = query.trim().toLowerCase();

  const filtered = q
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    : posts;

  return (
    <>
      {/* Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-primary text-xs tracking-[0.3em] uppercase mb-2">All Records</div>
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tighter text-on-surface">
              Archive
            </h1>
            <p className="text-on-surface-variant font-mono text-sm mt-3">
              {filtered.length}{q ? ` of ${posts.length}` : ""} post{posts.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-80">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all posts…"
                className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-neutral-500 pl-10 pr-8 py-3 transition-all outline-none text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xl text-outline-variant hover:text-on-surface transition-colors leading-none"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="py-20 text-center text-outline-variant font-mono text-sm uppercase">
          No records found in the database.
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-outline-variant font-mono text-sm uppercase">
          No results for &quot;{query}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => {
            const badgeColor = badgeColors[post.category] || badgeColors.dev;
            const titleHoverColor = titleHoverColors[post.category] || titleHoverColors.dev;

            return (
              <Link
                key={`${post.category}-${post.slug}`}
                href={`/${post.category}/${post.slug}`}
                className="rounded-lg bg-surface-container hover:bg-surface-bright border border-white/5 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 group overflow-hidden"
              >
                {post.thumbnail ? (
                  <div className="relative w-full aspect-video flex-shrink-0">
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video flex-shrink-0 bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">description</span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border ${badgeColor}`}>
                      {post.category}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                      {post.date
                        ? new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                  </div>

                  <h2 className={`font-headline text-lg font-bold text-on-surface mb-3 leading-tight transition-colors ${titleHoverColor}`}>
                    {post.title}
                  </h2>

                  {post.summary && (
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1">
                      {post.summary}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
                    {post.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase border border-primary/20">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
