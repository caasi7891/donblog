import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";

/**
 * /api/trading/history-detail
 * Used ONLY by the /trading/history daily report page.
 * Home dashboard (summary) is NOT affected.
 *
 * Uses kt00009 (기간별주문체결상세) for granular logs.
 * Calculates ROR per SELL log using intra-day matching + summary fallback.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYYMMDD expected
    const accounts = KiwoomClient.getAccounts();

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No Kiwoom accounts configured" }, { status: 400 });
    }

    const acc = accounts[0];
    const targetDate = date || undefined;

    // Parallel fetch: granular executions (kt00009) and summary data (ka10170)
    const [rawDetail, rawHistory] = await Promise.all([
      (KiwoomClient as any).getOrderExecutionDetail(acc, targetDate),
      KiwoomClient.getTradeHistory(acc, targetDate),
    ]);

    // ── 1. Create Summary Map (ka10170) for historical fallback ──────────
    const summaryMap = new Map<string, { buyPrice: number }>();
    if (rawHistory && !rawHistory.error) {
      const summaryRows: any[] = rawHistory.tdy_trde_diary ?? [];
      summaryRows.forEach((item: any) => {
        const nm = String(item.stk_nm ?? "").trim();
        const bp = Number(String(item.buy_avg_pric || "0").replace(/,/g, ""));
        if (nm && bp > 0) summaryMap.set(nm, { buyPrice: bp });
      });
    }

    // ── 2. Process Granular Rows (kt00009) ──────────────────────────────
    const rowsRaw: any[] =
      rawDetail?.acnt_ord_cntr_prst_array ??
      rawDetail?.output ??
      rawDetail?.output1 ??
      rawDetail?.res_cntg_list ??
      rawDetail?.detail ??
      [];

    const rows = rowsRaw.filter((item: any) => {
      const name = String(item.stk_nm ?? "").trim();
      const code = String(item.stk_cd ?? "").trim();
      return name !== "" && code !== "" && name !== "0000000";
    });

    // Sort by time to ensure BUYS are processed before SELLS
    rows.sort((a, b) => String(a.cntr_tm ?? "").localeCompare(String(b.cntr_tm ?? "")));

    const intraDayBuyPrices = new Map<string, number>();
    const seenBuyOrders = new Set<string>();

    const detailedLogs = rows.map((item: any) => {
      const ioTpNm = String(item.io_tp_nm ?? "");
      let side: "BUY" | "SELL" | "UNKNOWN" = "UNKNOWN";
      if (ioTpNm.includes("매도")) side = "SELL";
      else if (ioTpNm.includes("매수")) side = "BUY";

      // Price tracking
      const qty = Number(String(item.cntr_qty ?? "0").replace(/,/g, ""));
      const price = Number(String(item.cntr_uv ?? item.ord_uv ?? "0").replace(/,/g, ""));
      
      if (side === "BUY") {
        intraDayBuyPrices.set(item.stk_nm, price);
      }

      // Deduplicate BUY orders for display (user: "buy once, show once")
      const ordNo = String(item.ord_no ?? "");
      let isVisible = true;
      if (side === "BUY") {
        if (seenBuyOrders.has(ordNo)) isVisible = false;
        seenBuyOrders.add(ordNo);
      }

      // Calculate ROR for SELL
      let ror = "--";
      if (side === "SELL") {
        // Try intra-day buy price first, then summary fallback
        const buyPrice = intraDayBuyPrices.get(item.stk_nm) ?? summaryMap.get(item.stk_nm)?.buyPrice ?? 0;
        if (buyPrice > 0) {
          // Calculation: ((Sell / Buy) - 1) * 100 - Fee(0.23)
          const rawRate = ((price / buyPrice) - 1) * 100 - 0.23;
          ror = `${rawRate > 0 ? "+" : ""}${rawRate.toFixed(2)}%`;
        } else {
          ror = "0.00%";
        }
      }

      // Time formatting
      const rawTime = String(item.cntr_tm ?? item.ord_tm ?? "");
      let timeStr = "------";
      if (rawTime.includes(":") && rawTime.length >= 8) {
        timeStr = rawTime.substring(0, 8);
      } else if (rawTime.length >= 6) {
        const t = rawTime.replace(/\D/g, "").slice(0, 6);
        timeStr = `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
      }

      return {
        name: item.stk_nm,
        code: item.stk_cd,
        qty,
        price,
        totalAmount: qty * price,
        ror,
        pnlStr: `${qty.toLocaleString()}주 @${price.toLocaleString()}`,
        time: timeStr,
        side,
        isVisible,
        raw: item,
      };
    }).filter(log => log.isVisible); // filter out duplicate buys

    return NextResponse.json({
      date: date ?? "",
      tradeCount: detailedLogs.length,
      detailedLogs,
    });
  } catch (error: any) {
    console.error("[history-detail] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
