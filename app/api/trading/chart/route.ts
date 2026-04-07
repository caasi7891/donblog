import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stockCode = searchParams.get("stockCode");
  const date = searchParams.get("date"); // YYYYMMDD

  if (!stockCode || !date) {
    return NextResponse.json({ error: "Missing stockCode or date" }, { status: 400 });
  }

  const incomingCode = (stockCode || "").trim().replace(/^A/, "");
  const baseCode = incomingCode.replace(/_AL$/, "").replace(/[^0-9a-zA-Z]/g, "");

  try {
    // Phase 1: Check Database Snapshot (Persistence)
    const { data: cached, error: dbError } = await supabase
      .from('trading_candles')
      .select('candles')
      .eq('stock_code', baseCode)
      .eq('trading_date', date)
      .maybeSingle();

    if (cached && cached.candles) {
      console.log(`[DEBUG] Chart Cache HIT for ${baseCode} on ${date}`);
      return NextResponse.json({
        data: cached.candles,
        meta: {
          source: "database_snapshot",
          count: (cached.candles as any[]).length,
          stockCode: baseCode,
          date
        }
      });
    }

    if (dbError) {
      console.error(`[DEBUG] Database error while checking cache:`, dbError);
    }

    // Phase 2: Fetch from Live Kiwoom API
    const accounts = KiwoomClient.getAccounts();
    if (accounts.length === 0) {
      throw new Error("No Kiwoom accounts configured");
    }

    let chartData: any[] | null = null;
    let lastError: any = null;

    const codesToTry = [`${baseCode}_AL`, baseCode, `A${baseCode}`].filter((v, i, a) => a.indexOf(v) === i);

    for (const config of accounts) {
      console.log(`[DEBUG] Fetching live 1m chart for ${baseCode} on ${date} using ${config.label}`);
      
      let res: any = null;
      let sourceKey = "";
      for (const tCode of codesToTry) {
        res = await KiwoomClient.getMinuteChart(config, tCode, date);
        if (!res) continue;

        const potentialKeys = [
          "stk_min_pole_chart_qry_all",
          "stk_min_pole_chart_qry",
          "res_shrt_chart_list",
          "output2",
          "output1",
          "output"
        ];

        let rows: any[] = [];
        if (Array.isArray(res) && res.length > 0) {
          rows = res;
          sourceKey = "array_root";
        } else {
          for (const key of potentialKeys) {
            if (Array.isArray(res?.[key]) && res[key].length > 0) {
              rows = res[key];
              sourceKey = key;
              break;
            }
          }
        }

        if (rows.length > 0) {
          chartData = rows;
          (chartData as any)._sourceKey = sourceKey;
          (chartData as any)._usedCode = tCode;
          break;
        }
        
        if (res.msg1 || res.message || res.error) {
          lastError = res;
        }
      }

      if (chartData) break;
      lastError = lastError || res;
    }

    if (!chartData || chartData.length === 0) {
      return NextResponse.json({ 
        error: "Failed to fetch chart data. API returned no results.", 
        details: lastError 
      }, { status: 500 });
    }

    const usedCode = (chartData as any)._usedCode || baseCode;

    const candles = chartData.map((c: any) => {
      const timeStr = String(c.cntr_tm || c.stkpc_date || c.stkpc_time || "").trim();
      const parsePrice = (p: string) => Number(String(p || "0").replace(/[\+\-]/g, ""));

      let iso = "";
      if (timeStr.length >= 12) {
        iso = `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)}T${timeStr.slice(8, 10)}:${timeStr.slice(10, 12)}:${timeStr.slice(12, 14) || "00"}+09:00`;
      } else if (timeStr.length === 6) {
        iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}+09:00`;
      } else if (timeStr.length === 4) {
        iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:00+09:00`;
      } else if (timeStr.length === 8) {
        iso = `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)}T09:00:00+09:00`;
      } else {
        iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T09:00:00+09:00`;
      }
      
      const unixTime = Math.floor(new Date(iso).getTime() / 1000);
      if (isNaN(unixTime)) return null;

      return {
        time: unixTime,
        open: parsePrice(c.open_pric || c.stkpc_open || c.stkpc_oprc || c.stk_oprc || c.stk_open || c.open || c.stk_prpr),
        high: parsePrice(c.high_pric || c.stkpc_high || c.stkpc_hprc || c.stk_hgpr || c.hgpr || c.high || c.stk_prpr),
        low: parsePrice(c.low_pric || c.stkpc_low || c.stkpc_lprc || c.stk_lwpr || c.lwpr || c.low || c.stk_prpr),
        close: parsePrice(c.cur_prc || c.stkpc_clpr || c.stkpc_cprc || c.stk_prpr || c.stk_clpr || c.prpr || c.close || c.cur),
      };
    }).filter((c): c is any => c !== null && (c.open !== 0 || c.close !== 0));

    candles.sort((a, b) => a.time - b.time);

    // Phase 3: Archive to Database for Persistence
    if (candles.length > 0) {
      console.log(`[DEBUG] Archiving chart for ${baseCode} on ${date} (${candles.length} candles)`);
      const { error: archiveError } = await supabase
        .from('trading_candles')
        .upsert({
          stock_code: baseCode,
          trading_date: date,
          candles: candles
        }, { onConflict: 'stock_code,trading_date' });

      if (archiveError) {
        console.error(`[DEBUG] Failed to archive chart data:`, archiveError);
      }
    }

    return NextResponse.json({
      data: candles,
      meta: {
        source: `kiwoom_live [${usedCode}]`,
        count: candles.length,
        stockCode: baseCode,
        date
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
