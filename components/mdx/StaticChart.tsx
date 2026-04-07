"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, createSeriesMarkers, IChartApi } from "lightweight-charts";

interface ChartData {
  time?: number; 
  date?: string | number;
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
  const chartRef = useRef<IChartApi | null>(null); // Guard against double-init
  const [data, setData] = React.useState<ChartData[] | null>(initialData || null);
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<string | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!initialData && code && date) {
      setLoading(true);
      const d = date.replace(/-/g, "");
      fetch(`/api/trading/chart?stockCode=${code}&date=${d}`)
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            let json: any = {};
            try { json = JSON.parse(body); } catch (e) {}
            throw new Error(json?.error || `HTTP ${res.status}: ${res.statusText || 'Server Error'}`);
          }
          return res.json();
        })
        .then(json => {
          if (json && json.data && Array.isArray(json.data)) {
            setData(json.data);
            const source = json.meta?.source || json.meta?.sourceKey || "unknown";
            setDebugInfo(`${json.data.length} BARS [${source}]`);
            setError(null);
          } else {
            setError("Invalid response format from server");
            setDebugInfo("FAILED");
          }
        })
        .catch(err => {
          setError(err.message);
          setDebugInfo("ERROR");
        })
        .finally(() => setLoading(false));
    } else if (initialData) {
      setData(initialData);
    }
  }, [initialData, code, date]);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0 || !mounted) return;

    // If a chart already exists in this container, remove it first
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    let resizeObserver: ResizeObserver | null = null;

    const initializeChart = () => {
      if (!chartContainerRef.current) return;

      const container = chartContainerRef.current;
      if (container.clientWidth <= 0) {
        // If it's 0, we can try again on the next frame or let ResizeObserver handle it
        return;
      }

      // If a chart already exists, remove it first
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: "#131313" },
          textColor: "#acabaa",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.05)" },
          horzLines: { color: "rgba(255, 255, 255, 0.05)" },
        },
        width: container.clientWidth || 300,
        height: 350,
        timeScale: { 
          visible: true,
          borderColor: "rgba(255, 255, 255, 0.1)",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 6,
          rightOffset: 5,
          shiftVisibleRangeOnNewBar: true,
          tickMarkFormatter: (time: any) => {
            try {
              const t = typeof time === 'number' ? time : Number(time);
              const d = new Date((t + 9 * 3600) * 1000);
              const hh = d.getUTCHours().toString().padStart(2, '0');
              const mm = d.getUTCMinutes().toString().padStart(2, '0');
              if (hh === '00' && mm === '00') {
                 return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
              }
              return `${hh}:${mm}`;
            } catch (e) { return ""; }
          },
        },
        localization: {
          locale: 'ko-KR',
          priceFormatter: (price: number) => Math.round(price).toLocaleString(),
          timeFormatter: (time: any) => {
            try {
              const t = typeof time === 'number' ? time : Number(time);
              const d = new Date((t + 9 * 3600) * 1000);
              const hh = d.getUTCHours().toString().padStart(2, '0');
              const mm = d.getUTCMinutes().toString().padStart(2, '0');
              const ss = d.getUTCSeconds().toString().padStart(2, '0');
              return `${hh}:${mm}:${ss}`;
            } catch (e) { return String(time); }
          }
        },
        rightPriceScale: { 
          borderColor: "rgba(255, 255, 255, 0.1)",
          autoScale: true,
          visible: true,
        },
      });

      chartRef.current = chart;

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#4fb252",
        downColor: "#ee7d77",
        borderVisible: false,
        wickUpColor: "#4fb252",
        wickDownColor: "#ee7d77",
        lastValueVisible: false,
        priceLineVisible: false,
      });

      const chartRenderData = data.map((d) => {
        let t: number = 0;
        if (typeof d.time === "number") {
          t = d.time;
        } else if (typeof d.date === "number") {
          t = d.date;
        } else if (typeof d.date === "string") {
          const dateStr = d.date.includes(" ") ? d.date.replace(/ /g, "T") : d.date;
          const parsed = new Date(dateStr + (dateStr.includes("+") || dateStr.includes("Z") ? "" : "+09:00")).getTime();
          t = Math.floor(parsed / 1000);
        }
        return { time: t as any, open: d.open, high: d.high, low: d.low, close: d.close };
      }).filter(d => !isNaN(d.time as number) && d.time !== 0);
      
      chartRenderData.sort((a, b) => (a.time as number) - (b.time as number));

      const seen = new Set<number>();
      const uniqueData = chartRenderData.filter(d => {
        if (seen.has(d.time as number)) return false;
        seen.add(d.time as number);
        return true;
      });

      if (uniqueData.length > 0) {
        candlestickSeries.setData(uniqueData as any);
      }

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

      parsedMarkers.forEach(m => {
        const priceValue = Number(m.price);
        const sideLabel = m.side;
        const markerColor = sideLabel === "BUY" ? "#4fb252" : "#ee7d77";
        if (!isNaN(priceValue) && priceValue > 0) {
          candlestickSeries.createPriceLine({
            price: priceValue,
            color: markerColor,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: false,
            title: "",
          });
        }
      });

      const chartMarkers: any[] = parsedMarkers.map(m => {
        const priceValue = Number(m.price);
        const sideLabel = m.side;
        const markerColor = sideLabel === "BUY" ? "#4fb252" : "#ee7d77";
        return {
          time: typeof m.time === "number" ? m.time : Number(m.time),
          position: sideLabel === "BUY" ? "belowBar" : "aboveBar",
          color: markerColor,
          shape: sideLabel === "BUY" ? "arrowUp" : "arrowDown",
          text: m.text || `${sideLabel} @ ${priceValue.toLocaleString()}`,
        };
      });

      if (chartMarkers.length > 0) {
        createSeriesMarkers(candlestickSeries, chartMarkers);
      }

      chart.timeScale().fitContent();

      resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        const { width } = entries[0].contentRect;
        if (width > 0 && chartRef.current) {
          chartRef.current.applyOptions({ width });
        }
      });
      resizeObserver.observe(container);
    };

    const animFrame = requestAnimationFrame(initializeChart);

    return () => {
      cancelAnimationFrame(animFrame);
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, markers, mounted]);

  if (!mounted) return <div className="w-full h-[350px] bg-surface-container-low rounded-xl animate-pulse" />;

  return (
    <div className="my-8 not-prose">
      <div className="bg-surface-container-low p-2 rounded-xl border border-white/5 overflow-hidden">
        <div className="relative min-h-[350px]">
          <div className="absolute top-2 left-4 z-10 flex flex-col gap-1">
             <div className="flex gap-2 items-center">
               <span className="font-mono text-sm font-bold text-primary">{ticker}</span>
               <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant flex items-center tracking-tighter">
                 {loading ? 'LOADING...' : (debugInfo || '1M CHART')}
                 {data && !loading && (initialData ? ' [SNAPSHOT]' : ' [LIVE]')}
               </span>
             </div>
             {!loading && data && data.length > 0 && (
               <span className="font-mono text-[8px] text-outline/50 uppercase" suppressHydrationWarning>
                 TR: ka10080 | REQ: {code} | {new Date((data[0]?.time || 0) * 1000).toLocaleTimeString()} ~ {new Date((data[data.length-1]?.time || 0) * 1000).toLocaleTimeString()}
               </span>
             )}
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
              <span className="text-[10px] text-red-400 font-mono uppercase text-center">
                FAILURE: {ticker}
              </span>
              <span className="text-[8px] text-red-400/60 font-mono mt-1 text-center max-w-[200px] break-words">
                {error}
              </span>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-[350px]" />
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase text-center text-outline mt-2">
        Fig: {ticker} Trade Execution Profile
      </p>
    </div>
  );
}
