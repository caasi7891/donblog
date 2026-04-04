"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { PostMetadata } from "@/lib/mdx";

interface Props {
  category: string;
  categoryTitle: string;
  featuredPost: PostMetadata | null;
  otherPosts: PostMetadata[];
}

export function CategoryPostList({ category, categoryTitle, featuredPost, otherPosts }: Props) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const filteredFeatured =
    !isSearching
      ? featuredPost
      : featuredPost &&
        (featuredPost.title.toLowerCase().includes(q) ||
          featuredPost.summary?.toLowerCase().includes(q) ||
          featuredPost.tags?.some((t) => t.toLowerCase().includes(q)))
      ? featuredPost
      : null;

  const filteredOther = isSearching
    ? otherPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    : otherPosts;

  const noResults = isSearching && !filteredFeatured && filteredOther.length === 0;
  const hasNoPosts = !featuredPost && otherPosts.length === 0;

  return (
    <>
      {/* Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-primary text-xs tracking-[0.3em] uppercase mb-2">Repository Updates</div>
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tighter text-on-surface capitalize">
              {categoryTitle}
            </h1>
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
                placeholder={`Search ${categoryTitle.toLowerCase()}…`}
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

      {/* Content */}
      {hasNoPosts ? (
        <div className="py-20 text-center text-outline-variant font-mono text-sm uppercase">
          No records found in this category yet.
        </div>
      ) : noResults ? (
        <div className="py-20 text-center text-outline-variant font-mono text-sm uppercase">
          No results for &quot;{query}&quot;
        </div>
      ) : (
        <>
          {/* Featured post (normal layout, not searching) */}
          {filteredFeatured && !isSearching && (
            <section className="mb-12">
              <FeaturedCard post={filteredFeatured} category={category} />
            </section>
          )}

          {/* Grid: when searching, show featured in grid too */}
          {isSearching ? (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatured && <PostCard post={filteredFeatured} category={category} />}
              {filteredOther.map((post) => (
                <PostCard key={post.slug} post={post} category={category} />
              ))}
            </section>
          ) : (
            filteredOther.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOther.map((post) => (
                  <PostCard key={post.slug} post={post} category={category} />
                ))}
              </section>
            )
          )}
        </>
      )}
    </>
  );
}

function FeaturedCard({ post, category }: { post: PostMetadata; category: string }) {
  return (
    <Link
      href={`/${category}/${post.slug}`}
      className="block group relative overflow-hidden rounded-xl bg-surface-container border border-white/5 hover:bg-surface-bright transition-all duration-300"
    >
      <div className="aspect-[16/7] md:aspect-[21/9] w-full relative">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/80 to-transparent z-10" />
        {post.thumbnail ? (
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover opacity-50 mix-blend-luminosity group-hover:opacity-70 transition-opacity"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-primary/20" />
        )}
      </div>
      <div className="p-8 -mt-24 relative z-20">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-0.5 rounded-sm bg-primary-container text-on-primary-container text-[10px] font-mono font-bold">LATEST</span>
          <span className="font-mono text-neutral-500 text-[10px] uppercase">{post.date}</span>
        </div>
        <h2 className="font-headline text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
        <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed mb-6">{post.summary}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {post.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-primary uppercase">#{tag}</span>
            ))}
          </div>
          <span className="flex items-center gap-2 font-mono text-xs text-on-surface group-hover:text-primary transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-sm">link</span> READ
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post, category }: { post: PostMetadata; category: string }) {
  return (
    <Link
      href={`/${category}/${post.slug}`}
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
        <div className="font-mono text-[10px] text-neutral-500 uppercase mb-3">{post.date}</div>
        <h3 className="font-headline text-lg font-bold text-white mb-3 leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1">{post.summary}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase border border-primary/20">#{tag}</span>
          ))}
        </div>
        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] font-mono text-primary uppercase tracking-tighter">Read Full Log</span>
          <span className="material-symbols-outlined text-sm text-neutral-500 group-hover:text-white transition-colors">arrow_right_alt</span>
        </div>
      </div>
    </Link>
  );
}
