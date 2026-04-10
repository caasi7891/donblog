"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ExecutionLog {
  name: string;
  code: string;
  qty: number;
  price: number;
  totalAmount: number;
  ror: string;
  pnlStr: string;
  time: string;
  side: "BUY" | "SELL" | "UNKNOWN";
  raw?: any;
}

interface HistoryDetailData {
  date: string;
  tradeCount: number;
  detailedLogs: ExecutionLog[];
  debugKeys?: string[];
  sampleItem?: any;
  rawResponse?: any;
}

function HistoryDetailContent() {
  const [data, setData] = useState<HistoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateParam = searchParams.get("date") || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0].replace(/-/g, "");
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam.length === 8) {
      return `${dateParam.substring(0, 4)}-${dateParam.substring(4, 6)}-${dateParam.substring(6, 8)}`;
    }
    return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0];
  });

  const displayDate = `${dateParam.substring(0, 4)}-${dateParam.substring(4, 6)}-${dateParam.substring(6, 8)}`;

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/trading/history-detail?date=${dateParam}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((err) => console.error("History fetch failed:", err))
      .finally(() => setLoading(false));
  }, [dateParam]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    router.push(`/trading/history?date=${newDate.replace(/-/g, "")}`);
  };

  // Aggregate totals from per-execution rows for display
  const sells = data?.detailedLogs.filter((l) => l.side === "SELL") ?? [];
  const buys = data?.detailedLogs.filter((l) => l.side === "BUY") ?? [];

  return (
    <main className="min-h-screen bg-surface-container-lowest p-6 md:p-12 font-mono">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-outline-variant/20 pb-8">
          <div className="flex justify-between items-start mb-6">
            <Link
              href="/"
              className="text-primary-dim hover:text-primary transition-colors text-xs uppercase tracking-tighter inline-block"
            >
              ← BACK_TO_HOME
            </Link>

            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                Select Temporal Window
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs p-2 rounded-sm focus:outline-none focus:border-primary [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface tracking-tighter mb-2 italic uppercase">
                DAILY_REPORT.
              </h1>
              <p className="text-on-surface-variant text-xl tracking-widest uppercase opacity-60 italic">
                {displayDate}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-on-surface-variant tracking-widest uppercase mb-1">
                EXECUTIONS
              </span>
              <span className="text-5xl font-bold">
                {loading ? "SYNC..." : (data?.tradeCount ?? 0).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-surface-container border border-outline-variant/10 p-6 rounded-sm shadow-xl">
            <span className="block text-[10px] text-on-surface-variant tracking-widest uppercase mb-2">
              Buy Orders
            </span>
            <span className="text-3xl font-bold text-blue-400">
              {loading ? "--" : buys.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="bg-surface-container border border-outline-variant/10 p-6 rounded-sm shadow-xl">
            <span className="block text-[10px] text-on-surface-variant tracking-widest uppercase mb-2">
              Sell Orders
            </span>
            <span className="text-3xl font-bold text-red-400">
              {loading ? "--" : sells.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="bg-surface-container border border-outline-variant/10 p-6 rounded-sm flex flex-col items-center justify-center gap-2">
            <button
              onClick={() => window.print()}
              className="w-full text-[10px] text-primary border border-primary/20 px-4 py-3 hover:bg-primary/10 transition-colors uppercase font-bold"
            >
              Print Official Log
            </button>
          </div>
        </div>

        {/* Detailed Execution Log Table */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
              Transactional Narrative
            </h3>
            <div className="flex-1 h-px bg-outline-variant/10" />
          </div>

          <div className="bg-surface-container border border-outline-variant/10 rounded-sm overflow-hidden shadow-2xl">
            {/* Table header */}
            <div className="p-4 bg-black/40 grid grid-cols-7 text-[10px] uppercase text-on-surface-variant tracking-widest border-b border-outline-variant/20 font-bold">
              <span>Entity</span>
              <span className="text-center">Action</span>
              <span className="text-center">Qty</span>
              <span className="text-center">Price</span>
              <span className="text-center">Total Amount</span>
              <span className="text-center">ROR</span>
              <span className="text-right">Registry Time</span>
            </div>

            <div className="divide-y divide-outline-variant/20 italic">
              {loading ? (
                <div className="p-16 text-center text-neutral-600 italic text-sm animate-pulse">
                  DECRYPTING EXECUTION LEDGER...
                </div>
              ) : !data?.detailedLogs || data.detailedLogs.length === 0 ? (
                <div className="p-16 text-center text-neutral-600 italic text-sm">
                  NO HISTORICAL TRACE DETECTED FOR THIS TEMPORAL WINDOW.
                </div>
              ) : (
                data.detailedLogs.map((log, i) => {
                  let sideColor = "bg-neutral-800 text-neutral-400";
                  if (log.side === "BUY")
                    sideColor = "bg-blue-900/40 text-blue-300 border border-blue-500/30";
                  if (log.side === "SELL")
                    sideColor = "bg-red-900/40 text-red-300 border border-red-500/30";

                  const timeColor =
                    log.time === "------"
                      ? "text-neutral-700"
                      : "text-on-surface-variant group-hover:text-primary";

                    return (
                      <div
                        key={i}
                        className="p-4 grid grid-cols-7 items-center hover:bg-primary/5 transition-colors group border-l-2 border-transparent hover:border-primary"
                      >
                        <span className="text-sm font-bold tracking-tight text-on-surface">
                          {log.name}
                        </span>
                        <div className="flex justify-center">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${sideColor}`}
                          >
                            {log.side}
                          </span>
                        </div>
                        <span className="text-center font-mono text-xs text-on-surface-variant">
                          {log.qty > 0 ? `${log.qty.toLocaleString()}주` : "--"}
                        </span>
                        <span className="text-center font-bold font-mono text-on-surface">
                          {log.price > 0 ? `₩${log.price.toLocaleString()}` : "--"}
                        </span>
                        <span className="text-center font-mono text-xs text-on-surface-variant">
                          {log.totalAmount > 0 ? `₩${log.totalAmount.toLocaleString()}` : "--"}
                        </span>
                        <span className={`text-center font-bold font-mono text-xs ${log.ror.includes('+') ? 'text-green-400' : log.ror.includes('-') ? 'text-red-400' : 'text-neutral-500'}`}>
                          {log.ror}
                        </span>
                        <span
                          className={`text-right font-mono text-[11px] transition-colors ${timeColor}`}
                        >
                          [{log.time}]
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center font-mono text-xl text-primary animate-pulse italic uppercase">
          Decrypting History File...
        </div>
      }
    >
      <HistoryDetailContent />
    </Suspense>
  );
}
