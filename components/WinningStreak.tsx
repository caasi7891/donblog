"use client";

import { useEffect, useState } from "react";

export function WinningStreak() {
  const [streak, setStreak] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch("/api/trading/streak");
        const data = await res.json();
        if (data.streak !== undefined) {
          setStreak(data.streak);
        }
      } catch (err) {
        console.error("Failed to fetch streak:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStreak();
  }, []);

  if (loading || streak === null || streak === 0) return null;

  return (
    <div className="flex items-center justify-center pointer-events-none select-none">
      <div className="relative group">
        {/* Animated Glow Backdrop */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        
        {/* Main Badge */}
        <div className="relative flex items-center gap-1.5 px-4 py-1.5 bg-[#0b0b0b] border border-white/10 rounded-full shadow-xl">
          <span className="text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent font-headline tracking-tighter">
            {streak} DAY STREAK
          </span>
          <span className="text-base animate-bounce duration-700">🔥</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-float {
          animation: subtle-float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
