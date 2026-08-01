"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WinningStreak } from "./WinningStreak";

type TokenBtnState = "idle" | "loading" | "ok" | "error";

export function TopNavBar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenState, setTokenState] = useState<TokenBtnState>("idle");
  const [tokenMessage, setTokenMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tokenResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTokenRefresh = async () => {
    if (tokenState === "loading") return;
    if (tokenResetTimer.current) clearTimeout(tokenResetTimer.current);

    setTokenState("loading");
    setTokenMessage("");
    try {
      const res = await fetch("/api/trading/token/refresh", { method: "POST" });
      const data = await res.json();
      type RefreshResult = {
        broker: string;
        label: string;
        ok: boolean;
        expiresAt?: string;
        error?: string;
      };
      const results: RefreshResult[] = data.results ?? [];

      if (!res.ok || !data.success) {
        const failed = results.filter((r) => !r.ok);
        const detail =
          data.error ||
          failed.map((r) => `${r.label}: ${r.error ?? "fail"}`).join(" · ") ||
          "Token refresh failed";
        setTokenState("error");
        setTokenMessage(detail);
      } else {
        const summary = results
          .map((r) => {
            const when = r.expiresAt
              ? new Date(r.expiresAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
              : "ok";
            return `${r.label} ~ ${when}`;
          })
          .join(" · ");
        setTokenState("ok");
        setTokenMessage(summary || `갱신 완료 (${data.okCount}/${data.total})`);
      }
    } catch (err) {
      setTokenState("error");
      setTokenMessage(err instanceof Error ? err.message : "Network error");
    }

    tokenResetTimer.current = setTimeout(() => {
      setTokenState("idle");
      setTokenMessage("");
    }, 5000);
  };

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    return () => {
      if (tokenResetTimer.current) clearTimeout(tokenResetTimer.current);
    };
  }, []);

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
              {/* Kiwoom + KIS token refresh — left of Write Post */}
              <button
                type="button"
                onClick={handleTokenRefresh}
                disabled={tokenState === "loading"}
                title={tokenMessage || "Refresh Kiwoom & KIS API tokens"}
                className={`hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors border disabled:opacity-60 disabled:cursor-wait ${
                  tokenState === "ok"
                    ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
                    : tokenState === "error"
                      ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-white/10"
                }`}
              >
                {tokenState === "loading" ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                    Refreshing…
                  </>
                ) : tokenState === "ok" ? (
                  "Token OK"
                ) : tokenState === "error" ? (
                  "Token Fail"
                ) : (
                  "Refresh Token"
                )}
              </button>

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
