"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface ChartData {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StaticChartProps {
  data: ChartData[];
  ticker: string;
  buyPrice?: number | null;
  sellPrice?: number | null;
}

export function StaticChart({ data, ticker, buyPrice, sellPrice }: StaticChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#acabaa", // text-on-surface-variant
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#4fb252", // secondary (green)
      downColor: "#ee7d77", // error (red)
      borderVisible: false,
      wickUpColor: "#4fb252",
      wickDownColor: "#ee7d77",
    });

    // Need to handle typical dates mapping
    const chartRenderData = data.map((d) => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    
    // Sort by date just in case
    chartRenderData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    candlestickSeries.setData(chartRenderData);

    // Optional: Draw buy/sell markers if passed
    if (buyPrice || sellPrice) {
      const markers: any[] = [];
      if (buyPrice) {
        markers.push({
          time: chartRenderData[0].time, // Just pinning to start for static snapshot purposes unless specifics have timeframe
          position: "belowBar",
          color: "#4fb252",
          shape: "arrowUp",
          text: `Buy @ ${buyPrice}`,
        });
      }
      if (sellPrice) {
        markers.push({
          time: chartRenderData[chartRenderData.length - 1].time,
          position: "aboveBar",
          color: "#ee7d77",
          shape: "arrowDown",
          text: `Sell @ ${sellPrice}`,
        });
      }
      candlestickSeries.setMarkers(markers);
    }

    chart.timeScale().fitContent();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, buyPrice, sellPrice]);

  return (
    <div className="my-10 space-y-4">
      <div className="bg-surface-container-low p-2 rounded-xl border border-white/5 overflow-hidden">
        <div className="relative">
          <div className="absolute top-2 left-4 z-10 flex gap-2">
             <span className="font-mono text-sm font-bold text-primary">{ticker}</span>
             <span className="font-mono text-xs text-on-surface-variant flex items-center">STATIC SNAPSHOT</span>
          </div>
          <div ref={chartContainerRef} className="w-full h-[300px]" />
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase text-center text-outline">
        Fig: {ticker} Trade Execution Profile
      </p>
    </div>
  );
}
