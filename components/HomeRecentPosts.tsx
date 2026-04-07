"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { PostMetadata } from "@/lib/mdx";

const bgColors: Record<string, string> = {
  dev: "bg-primary-container/20 text-on-primary-container border-primary-container/30",
  trading: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
  travel: "bg-tertiary/10 text-tertiary border-tertiary/20",
};
const hoverColors: Record<string, string> = {
  dev: "group-hover:text-primary",
  trading: "group-hover:text-secondary",
  travel: "group-hover:text-tertiary",
};

export function HomeRecentPosts({ posts }: { posts: PostMetadata[] }) {
  const [query, setQuery] = useState("");

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
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/10 pb-4">
        <h2 className="text-2xl font-headline font-bold">Recent Records</h2>
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              className="bg-surface-container-lowest border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface placeholder:text-neutral-500 pl-9 pr-7 py-1.5 transition-all outline-none text-sm w-40 focus:w-52 transition-[width]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors text-lg leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <Link href="/archive" className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap flex-shrink-0">
            View All Posts
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="md:col-span-3 py-12 text-center text-outline-variant font-mono text-sm uppercase">
            {query ? `No results for "${query}"` : "No recent records found."}
          </div>
        ) : (
          filtered.map((post) => {
            const badgeColor = bgColors[post.category] || bgColors.dev;
            const titleHoverColor = hoverColors[post.category] || hoverColors.dev;

            return (
              <Link key={`${post.category}-${post.slug}`} href={`/${post.category}/${post.slug}`}>
                <article className="group bg-surface-container rounded-lg hover:bg-surface-bright transition-all duration-200 flex flex-col border border-transparent hover:border-outline-variant/20 h-full overflow-hidden">
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
                      <span className="material-symbols-outlined text-3xl text-outline-variant/50">description</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border ${badgeColor}`}>
                        {post.category}
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{post.date}</span>
                    </div>
                    <h3 className={`text-xl font-headline font-semibold text-on-surface transition-colors ${titleHoverColor}`}>
                      {post.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed flex-1">{post.summary}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {post.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase border border-primary/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
