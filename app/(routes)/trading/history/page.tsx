"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface TradingData {
  todayPnL: number;
  tradeCount: number;
  totalAsset: number;
  logs: string[];
}

function HistoryDetailContent() {
  const [data, setData] = useState<TradingData | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateParam = searchParams.get("date") || new Date().toISOString().split('T')[0].replace(/-/g, "");
  const displayDate = `${dateParam.substring(0, 4)}-${dateParam.substring(4, 6)}-${dateParam.substring(6, 8)}`;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/trading/summary?date=${dateParam}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Fetch Historical Detail Failed:", err);
      }
    }
    fetchData();
  }, [dateParam]);

  const pnlColor = data?.todayPnL && data.todayPnL < 0 ? "text-red-400" : (data?.todayPnL && data.todayPnL > 0 ? "text-green-400" : "text-on-surface-variant");

  return (
    <main className="min-h-screen bg-surface-container-lowest p-6 md:p-12 font-mono">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-outline-variant/20 pb-8">
          <Link href={`/?date=${dateParam}`} className="text-primary-dim hover:text-primary transition-colors text-xs uppercase tracking-tighter mb-4 inline-block">
            ← PREVIOUS_TERMINAL_CONTEXT
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface tracking-tighter mb-2 italic uppercase">
                DAILY_REPORT.
              </h1>
              <p className="text-on-surface-variant text-xl tracking-widest uppercase opacity-60 italic">{displayDate}</p>
            </div>
            <div className="text-right">
               <span className="block text-[10px] text-on-surface-variant tracking-widest uppercase mb-1">AGGREGATED PNL</span>
               <span className={`text-4xl font-bold ${pnlColor}`}>
                 {data ? (data.todayPnL > 0 ? `+${data.todayPnL.toLocaleString()}` : data.todayPnL.toLocaleString()) : "SYNC..."}
               </span>
            </div>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-surface-container border border-outline-variant/10 p-6 rounded-sm">
            <span className="block text-[10px] text-on-surface-variant tracking-widest uppercase mb-2">Executions</span>
            <span className="text-3xl font-bold">{data?.tradeCount.toString().padStart(2, '0') || "--"}</span>
          </div>
          <div className="bg-surface-container border border-outline-variant/10 p-6 rounded-sm">
             <span className="block text-[10px] text-on-surface-variant tracking-widest uppercase mb-2">Settled Assets</span>
             <span className="text-xl font-bold">{data?.totalAsset.toLocaleString() || "--"} <span className="text-xs opacity-50">KRW</span></span>
          </div>
          <div className="col-span-2 md:col-span-1 bg-surface-container border border-outline-variant/10 p-6 rounded-sm flex items-center justify-center">
             <button 
               onClick={() => window.print()}
               className="text-[10px] text-primary border border-primary/20 px-4 py-2 hover:bg-primary/10 transition-colors uppercase"
             >
               Print Official Log
             </button>
          </div>
        </div>

        {/* Detailed Logs */}
        <section>
          <div className="flex items-center gap-4 mb-6">
             <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">Transactional Narrative</h3>
             <div className="flex-1 h-px bg-outline-variant/10"></div>
          </div>
          
          <div className="bg-surface-container border border-outline-variant/10 rounded-sm overflow-hidden">
            <div className="p-4 bg-black/20 grid grid-cols-3 text-[10px] uppercase text-on-surface-variant tracking-widest border-b border-outline-variant/20">
               <span>Entity</span>
               <span className="text-center">Performance</span>
               <span className="text-right">Registry Time</span>
            </div>
            
            <div className="divide-y divide-outline-variant/10">
              {data?.logs.length === 0 || data?.logs[0] === "NO RECENT TRADES" ? (
                <div className="p-12 text-center text-neutral-600 italic text-sm">
                  NO HISTORICAL TRACE DETECTED FOR THIS TEMPORAL WINDOW.
                </div>
              ) : (
                data?.logs.map((log, i) => {
                  const parts = log.split(", ");
                  const name = parts[0];
                  const pnl = parts[1];
                  const time = parts[2];
                  
                  let logColor = "text-on-surface";
                  if (pnl?.includes("+")) logColor = "text-green-400";
                  else if (pnl?.includes("-")) logColor = "text-red-400";

                  return (
                    <div key={i} className="p-4 grid grid-cols-3 items-center hover:bg-primary/5 transition-colors group">
                       <span className="text-sm font-bold tracking-tight">{name}</span>
                       <span className={`text-center font-bold font-mono ${logColor}`}>{pnl}</span>
                       <span className="text-right font-mono text-[11px] text-on-surface-variant transition-colors group-hover:text-primary">
                         [{time}]
                       </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <footer className="mt-12 text-[10px] text-on-surface-variant/40 flex justify-between uppercase tracking-widest border-t border-outline-variant/10 pt-8 italic">
          <span>DonLog System Archive Entry: {dateParam}</span>
          <span>Integrity Check: PASSED</span>
        </footer>
      </div>
    </main>
  );
}

export default function TradingHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center font-mono text-xl text-primary animate-pulse italic uppercase">
        Decrypting History File...
      </div>
    }>
      <HistoryDetailContent />
    </Suspense>
  );
}
