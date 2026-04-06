"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, createSeriesMarkers } from "lightweight-charts";

interface ChartData {
  date: string; // YYYY-MM-DD HH:mm:ss
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Marker {
  time: string;
  side: "BUY" | "SELL";
  price: number;
  text?: string;
}

interface StaticChartProps {
  data?: ChartData[] | null;
  ticker: string;
  code?: string;
  date?: string;
  buyPrice?: number | null;
  sellPrice?: number | null;
  markers?: Marker[];
}

export function StaticChart({ data: initialData, ticker, code, date, markers }: StaticChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = React.useState<ChartData[] | null>(initialData || null);
  const [loading, setLoading] = React.useState(!initialData && !!code && !!date);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!initialData && code && date) {
      setLoading(true);
      // date is already YYYYMMDD format from the tag
      const d = date.replace(/-/g, "");
      fetch(`/api/trading/chart?stockCode=${code}&date=${d}`)
        .then(res => res.json())
        .then(json => {
          if (Array.isArray(json)) {
            setData(json);
          } else {
            console.error("[StaticChart] API error:", json);
            throw new Error(json?.error || "Invalid chart data");
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else if (initialData) {
      setData(initialData);
    }
  }, [initialData, code, date]);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#acabaa",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: container.clientWidth,
      height: 300,
      timeScale: { 
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: "rgba(255, 255, 255, 0.1)" },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#4fb252",
      downColor: "#ee7d77",
      borderVisible: false,
      wickUpColor: "#4fb252",
      wickDownColor: "#ee7d77",
    });

    const chartRenderData = data.map((d) => ({
      time: d.date as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    
    chartRenderData.sort((a, b) => (a.time as number) - (b.time as number));

    // Deduplicate by time (lightweight-charts requires unique timestamps)
    const seen = new Set<number>();
    const uniqueData = chartRenderData.filter(d => {
      if (seen.has(d.time as number)) return false;
      seen.add(d.time as number);
      return true;
    });
    candlestickSeries.setData(uniqueData as any);

    // Parse markers — they may arrive as a JSON string from MDX HTML props
    let parsedMarkers: any[] = [];
    if (markers) {
      try {
        parsedMarkers = typeof markers === "string"
          ? JSON.parse(markers as string)
          : Array.isArray(markers) ? markers : [];
      } catch (e) {
        console.warn("[StaticChart] Failed to parse markers:", e);
      }
    }

    const chartMarkers: any[] = parsedMarkers.map(m => ({
      time: typeof m.time === "number" ? m.time : Number(m.time),
      position: m.side === "BUY" ? "belowBar" : "aboveBar",
      color: m.side === "BUY" ? "#4fb252" : "#ee7d77",
      shape: m.side === "BUY" ? "arrowUp" : "arrowDown",
      text: m.text || `${m.side} @ ${Number(m.price).toLocaleString()}`,
    }));

    if (chartMarkers.length > 0) {
      createSeriesMarkers(candlestickSeries, chartMarkers);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, markers]);

  return (
    <div className="my-10 space-y-4">
      <div className="bg-surface-container-low p-2 rounded-xl border border-white/5 overflow-hidden">
        <div className="relative min-h-[300px]">
          <div className="absolute top-2 left-4 z-10 flex gap-2">
             <span className="font-mono text-sm font-bold text-primary">{ticker}</span>
             <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant flex items-center tracking-tighter">
               {loading ? 'LOADING DATA...' : '1M CHART'}
             </span>
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-400/70 font-mono uppercase">
              Failed to load chart: {ticker}
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-[300px]" />
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase text-center text-outline">
        Fig: {ticker} Trade Execution Profile
      </p>
    </div>
  );
}
