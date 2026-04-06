import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";

/**
 * /api/trading/history-detail
 * Used ONLY by the /trading/history daily report page.
 * Home dashboard (summary) is NOT affected.
 *
 * Uses kt00009 (기간별주문체결상세) which returns one row PER execution,
 * so partial sells (e.g. 광전자 sold 3x) appear as 3 separate log lines.
 *
 * kt00009 field names confirmed from raw response:
 *   - stk_nm       → stock name
 *   - io_tp_nm     → "현금매수" (Buy) / "현금매도" (Sell)
 *   - cntr_tm      → execution time (HH:MM:SS or HHMMSS)
 *   - cntr_qty     → executed quantity
 *   - cntr_uv      → executed price
 *   - stk_cd       → stock code
 *   array key: acnt_ord_cntr_prst_array
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

    // kt00009 — per-execution rows
    const raw = await (KiwoomClient as any).getOrderExecutionDetail(acc, date || undefined);

    // kt00009 wraps rows in acnt_ord_cntr_prst_array (confirmed from probe)
    const rowsRaw: any[] =
      raw?.acnt_ord_cntr_prst_array ??
      raw?.output ??
      raw?.output1 ??
      raw?.res_cntg_list ??
      raw?.detail ??
      [];

    // Filter out blank placeholder rows
    const rows = rowsRaw.filter((item: any) => {
      const name = String(item.stk_nm ?? "").trim();
      const code = String(item.stk_cd ?? "").trim();
      return name !== "" && code !== "" && name !== "0000000";
    });

    // Deduplicate BUY rows: if the same order number appears multiple times for a buy,
    // show it only once (user requested: "if I buy once, show once").
    // SELL rows are always kept individually (each partial sell = separate log).
    const seenBuyOrders = new Set<string>();
    const dedupedRows = rows.filter((item: any) => {
      const ioTpNm = String(item.io_tp_nm ?? "");
      const isBuy = ioTpNm.includes("매수");
      if (!isBuy) return true; // always keep sells
      const ordNo = String(item.ord_no ?? "");
      if (seenBuyOrders.has(ordNo)) return false;
      seenBuyOrders.add(ordNo);
      return true;
    });

    const detailedLogs = dedupedRows.map((item: any) => {
      // ── Side ──────────────────────────────────────────────────────────────
      // io_tp_nm: "현금매수" = Buy, "현금매도" = Sell
      const ioTpNm = String(item.io_tp_nm ?? "");
      let side: "BUY" | "SELL" | "UNKNOWN" = "UNKNOWN";
      if (ioTpNm.includes("매도")) side = "SELL";
      else if (ioTpNm.includes("매수")) side = "BUY";

      // ── Registry Time ──────────────────────────────────────────────────────
      // cntr_tm: execution time — can be "HH:MM:SS" or "HHMMSS"
      const rawTime = String(item.cntr_tm ?? item.ord_tm ?? "");
      let timeStr = "------";
      if (rawTime.includes(":") && rawTime.length >= 8) {
        // already formatted as HH:MM:SS
        timeStr = rawTime.substring(0, 8);
      } else if (rawTime.length >= 6) {
        const t = rawTime.replace(/\D/g, "").slice(0, 6);
        timeStr = `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
      } else if (rawTime.length > 0) {
        timeStr = rawTime;
      }

      // ── Qty & Price ────────────────────────────────────────────────────────
      const qty = Number(String(item.cntr_qty ?? "0").replace(/,/g, ""));
      const price = Number(String(item.cntr_uv ?? item.ord_uv ?? "0").replace(/,/g, ""));
      const pnlStr = `${qty.toLocaleString()}주 @${price.toLocaleString()}`;

      return {
        name: item.stk_nm,
        code: item.stk_cd,
        qty,
        price,
        pnlStr,
        time: timeStr,
        side,
        raw: item,
      };
    });

    return NextResponse.json({
      date: date ?? "",
      tradeCount: detailedLogs.length,
      detailedLogs,
      debugKeys: dedupedRows.length > 0 ? Object.keys(dedupedRows[0]) : [],
      sampleItem: dedupedRows.length > 0 ? dedupedRows[0] : null,
    });
  } catch (error: any) {
    console.error("[history-detail] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
