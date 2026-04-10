"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface TradingData {
  todayPnL: number;
  todayROR: number;
  tradeCount: number;
  totalAsset: number;
  logs: string[];
}

function TradingSummaryContent() {
  const [data, setData] = useState<TradingData | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = searchParams.get("date");
    if (d && d.length === 8) {
      return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
    }
    return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0];
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const apiDate = selectedDate.replace(/-/g, "");
        const res = await fetch(`/api/trading/summary?date=${apiDate}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
          if (d.logs) setTerminalLogs(d.logs);
        }
      } catch (err) {
        console.error("Fetch Trading Summary Failed:", err);
      }
    }
    fetchData();

    const isToday = selectedDate === new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0];
    if (isToday) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  const isHistorical = selectedDate !== new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0];
  
  // PnL Formatting with Color
  const pnlColor = data?.todayPnL && data.todayPnL < 0 ? "text-red-400" : (data?.todayPnL && data.todayPnL > 0 ? "text-green-400" : "text-on-surface-variant");
  const formattedPnL = data 
    ? (data.todayPnL > 0 ? `+${data.todayPnL.toLocaleString()}` : data.todayPnL.toLocaleString())
    : "0";

  // ROR Formatting with Color
  const rorColor = data?.todayROR && data.todayROR < 0 ? "text-red-400" : (data?.todayROR && data.todayROR > 0 ? "text-green-400" : "text-on-surface-variant");
  const formattedROR = data
    ? `${data.todayROR > 0 ? "+" : ""}${data.todayROR.toFixed(2)}%`
    : "0.00%";

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-surface-container rounded-xl p-8 border-l-2 border-primary shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-on-surface mb-2">Systems Operational.</h1>
              <div className="flex items-center gap-3">
                <p className="text-on-surface-variant font-mono text-sm tracking-tight uppercase">Trading Analytics Core</p>
                <div className="relative bg-black/40 rounded px-2 py-1 border border-outline-variant/20 flex items-center gap-2">
                   <span className="text-[10px] font-mono text-primary uppercase">Snapshot</span>
                   <input 
                     type="date"
                     value={selectedDate}
                     max={new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0]}
                     onChange={(e) => setSelectedDate(e.target.value)}
                     className="bg-transparent border-none text-[11px] font-mono text-on-surface focus:ring-0 cursor-pointer [color-scheme:dark]"
                   />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className={`bg-black/20 px-6 py-3 rounded-md border border-outline-variant/10 flex flex-col items-end min-w-[140px]`}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">PnL for Date</span>
                <span className={`text-3xl font-mono font-bold ${pnlColor}`}>
                  {formattedPnL}
                </span>
              </div>
              <div className={`bg-black/20 px-6 py-3 rounded-md border border-outline-variant/10 flex flex-col items-end min-w-[140px]`}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">ROR for Date</span>
                <span className={`text-2xl font-mono font-bold ${rorColor}`}>
                  {formattedROR}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="bg-surface-container-low px-4 py-2 rounded-sm border border-outline-variant/30 flex-1 sm:flex-none">
                <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Trades Executed</span>
                <span className="text-xl font-mono font-medium">{data?.tradeCount.toString().padStart(2, '0') || "00"}</span>
              </div>
              <div className="bg-surface-container-low px-4 py-2 rounded-sm border border-outline-variant/30 flex-1">
                <span className="block font-mono text-[10px] uppercase text-on-surface-variant">
                  {isHistorical ? "Settled Total Asset" : "Est. Total Asset"}
                </span>
                <p className="text-lg font-mono text-on-surface font-bold">
                  {data ? `${data.totalAsset.toLocaleString()} KRW` : "CONNECTING..."}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors"></div>
      </div>

      {/* Trade Log */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 flex flex-col gap-4">
        <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isHistorical ? "bg-primary-dim" : "bg-secondary animate-pulse"}`}></span> 
          Trade Log Output
        </h3>
        <div className="flex-1 font-mono text-[11px] space-y-2 text-on-surface-variant/80 overflow-hidden min-h-[120px]">
          {terminalLogs.length === 0 || terminalLogs[0] === "NO RECENT TRADES" ? (
             <p className="text-neutral-600 italic">No trading activity found for this date.</p>
          ) : (
            terminalLogs.map((log, i) => {
              // Conditional Coloring for Individual Log Lines
              let logColor = "text-on-surface-variant/80";
              if (log.includes("+")) logColor = "text-green-400";
              else if (log.includes("-")) logColor = "text-red-400";

              return (
                <p key={i} className={`${logColor} ${i === 0 ? "font-bold opacity-100" : "opacity-80"}`}>
                  {log}
                </p>
              );
            })
          )}
        </div>

          <button 
            type="button"
            onClick={() => {
              const apiDate = selectedDate.replace(/-/g, "");
              router.push(`/trading/history?date=${apiDate}`);
            }}
            className="w-full py-2 bg-surface-container text-on-surface font-mono text-[10px] uppercase tracking-widest border border-outline-variant/20 hover:bg-surface-bright transition-colors cursor-pointer text-center"
          >
            Historical Summary Detail
          </button>
      </div>
    </section>
  );
}

export function TradingSummary() {
  return (
    <Suspense fallback={<div className="h-48 bg-surface-container rounded-xl animate-pulse flex items-center justify-center font-mono text-xs uppercase text-on-surface-variant">Synchronizing Neural Core...</div>}>
      <TradingSummaryContent />
    </Suspense>
  );
}
