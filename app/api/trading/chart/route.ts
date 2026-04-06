import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stockCode = searchParams.get("stockCode");
  const date = searchParams.get("date"); // YYYYMMDD

  if (!stockCode || !date) {
    return NextResponse.json({ error: "Missing stockCode or date" }, { status: 400 });
  }

  try {
    const accounts = KiwoomClient.getAccounts();
    if (accounts.length === 0) {
      throw new Error("No Kiwoom accounts configured");
    }

    // Try each account until one succeeds
    let chartData: any[] | null = null;
    let lastError: any = null;

    // Standardize code: 152550 instead of A152550
    const cleanStockCode = (stockCode || "").trim().startsWith("A") ? stockCode.trim().slice(1) : stockCode.trim();

    for (const config of accounts) {
      console.log(`[DEBUG] Fetching 1m chart for ${cleanStockCode} on ${date} using ${config.label}`);
      
      const codesToTry = [`${cleanStockCode}_AL`, cleanStockCode];
      let res: any = null;

      for (const tCode of codesToTry) {
        res = await KiwoomClient.getMinuteChart(config, tCode, date);
        const rows = res?.stk_min_pole_chart_qry ?? res?.res_shrt_chart_list ?? res?.output ?? res?.output1 ?? [];
        if (Array.isArray(rows) && rows.length > 0) {
          chartData = rows;
          console.log(`[DEBUG] Success! Found ${rows.length} rows for ${tCode}`);
          break;
        }
      }

      if (chartData) break;
      lastError = res;
      console.warn(`[WARN] Account ${config.label} failed or returned no data for ${cleanStockCode}`);
    }

    if (!chartData || chartData.length === 0) {
      return NextResponse.json({ 
        error: "Failed to fetch chart data. API returned no results.", 
        details: lastError 
      }, { status: 500 });
    }

    const candles = chartData.map((c: any) => {
      const timeStr = c.cntr_tm || "";
      const parsePrice = (p: string) => Number(String(p || "0").replace(/[\+\-]/g, ""));

      // Kiwoom timestamps are KST (UTC+9). Must append +09:00 for correct Unix conversion.
      let iso = "";
      if (timeStr.length >= 12) {
        iso = `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)}T${timeStr.slice(8, 10)}:${timeStr.slice(10, 12)}:00+09:00`;
      } else {
        iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T09:00:00+09:00`;
      }
      const unixTime = Math.floor(new Date(iso).getTime() / 1000);

      return {
        date: unixTime,
        open: parsePrice(c.open_pric || c.stkpc_open),
        high: parsePrice(c.high_pric || c.stkpc_high),
        low: parsePrice(c.low_pric || c.stkpc_low),
        close: parsePrice(c.cur_prc || c.stkpc_clpr),
      };
    });

    return NextResponse.json(candles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
