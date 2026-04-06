"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WinningStreak } from "./WinningStreak";

export function TopNavBar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/archive?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b0b0b]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-neutral-100 font-headline">
            DonBlog
          </Link>
          <div className="hidden md:flex space-x-8 font-headline tracking-tight items-center">
            <Link href="/dev" className="text-neutral-500 hover:text-neutral-300 transition-colors">Dev</Link>
            <Link href="/trading" className="text-neutral-500 hover:text-neutral-300 transition-colors">Trading</Link>
            <Link href="/travel" className="text-neutral-500 hover:text-neutral-300 transition-colors">Travel</Link>
          </div>
        </div>

        {/* Center: Winning Streak */}
        <div className="hidden lg:flex flex-1 justify-center">
          <WinningStreak />
        </div>

        <div className="flex items-center gap-2">
          {/* Expandable Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className={`flex items-center overflow-hidden transition-all duration-300 ${searchOpen ? "w-52 border border-white/15 rounded-full bg-white/5" : "w-8"}`}>
              <button
                type="button"
                onClick={() => setSearchOpen((o) => !o)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-100 transition-colors"
                aria-label="Toggle search"
              >
                {searchOpen ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
              </button>
              {searchOpen && (
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search posts…"
                  className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-neutral-500 focus:outline-none pr-3 py-1.5"
                />
              )}
            </div>
          </form>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/20"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Write Post — left of avatar */}
              <Link
                href="/write"
                className="hidden md:block text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full transition-colors border border-white/10"
              >
                Write Post
              </Link>

              {/* Avatar + dropdown */}
              <div className="relative group cursor-pointer flex items-center">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User Avatar" className="w-8 h-8 rounded-full border border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-headline border border-emerald-500/30">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-neutral-100 p-2 hover:bg-white/10 transition-all duration-150 rounded-full scale-100 active:scale-90 border border-transparent hover:border-white/10" title="Login">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
