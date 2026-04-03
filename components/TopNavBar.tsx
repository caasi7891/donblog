"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function TopNavBar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b0b0b]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-neutral-100 font-headline">
            Building DonEngine
          </Link>
          <div className="hidden md:flex space-x-8 font-headline tracking-tight items-center">
            <Link href="/dev" className="text-neutral-500 hover:text-neutral-300 transition-colors">Dev</Link>
            <Link href="/trading" className="text-neutral-500 hover:text-neutral-300 transition-colors">Trading</Link>
            <Link href="/travel" className="text-neutral-500 hover:text-neutral-300 transition-colors">Travel</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="material-symbols-outlined text-neutral-100 p-2 hover:bg-white/5 transition-all duration-150 rounded-full scale-98 active:scale-95">
            search
          </button>
          
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/20"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link href="/write" className="hidden md:block text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full transition-colors border border-white/10">
                Write Post
              </Link>
              <div className="relative group cursor-pointer flex items-center">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User Avatar" className="w-8 h-8 rounded-full border border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-headline border border-emerald-500/30">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                
                {/* Dropdown for logout */}
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
            <Link href="/login" className="material-symbols-outlined text-neutral-100 p-2 hover:bg-white/5 transition-all duration-150 rounded-full scale-98 active:scale-95">
              account_circle
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
