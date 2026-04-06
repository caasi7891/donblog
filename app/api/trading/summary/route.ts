import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";

/**
 * /api/trading/summary
 * Used by the HOME DASHBOARD only.
 * Shows a simple aggregated summary: total PNL, asset value, and recent sell logs.
 * DO NOT use kt00009 here — that is only for /trading/history.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYYMMDD

    const accounts = KiwoomClient.getAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({ error: "No Kiwoom accounts configured" }, { status: 400 });
    }

    let totalTodayPnL = 0;
    let totalAsset = 0;
    const mergedLogs: string[] = [];
    const detailedLogs: any[] = [];

    for (const acc of accounts) {
      try {
        const [history, evaluation] = await Promise.all([
          KiwoomClient.getTradeHistory(acc, date || undefined),
          KiwoomClient.getAccountEvaluation(acc),
        ]);

        // PNL total from ka10170
        if (history && !history.error) {
          const pnl = Number(String(history.tot_pl_amt ?? "0").replace(/,/g, ""));
          totalTodayPnL += pnl;

          // Trade logs from ka10170 — one row per stock (sell summary)
          const rows: any[] = history.tdy_trde_diary ?? [];
          rows
            .filter((item: any) => {
              const nm = String(item.stk_nm ?? "").trim();
              return nm !== "" && nm !== "0000000";
            })
            .forEach((item: any) => {
              const pnlNum = Number(String(item.pl_amt ?? "0").replace(/,/g, ""));
              
              // Earning Rate (ROR) - Try multiple fields then fallback to manual calculation
              let earningRate = Number(String(item.erng_rt || item.pnl_rat || item.evlu_pft_lss_rat || "0").replace(/,/g, ""));
              
              if (earningRate === 0 && pnlNum !== 0) {
                // Manual fallback: Rate = Profit / Cost
                // Total Sell Amount = sel_avg_pric * sel_qty (or buy_qty/sel_qty depending on the TR)
                const sellPrc = Number(String(item.sel_avg_pric || "0").replace(/,/g, ""));
                const qty = Number(String(item.sel_qty || item.trde_qty || "0").replace(/,/g, ""));
                const sellAmt = sellPrc * qty;
                
                if (sellAmt > 0) {
                  const cost = sellAmt - pnlNum;
                  if (cost > 0) {
                    earningRate = (pnlNum / cost) * 100;
                  }
                } else {
                  // Alternative: (SellPrc - BuyPrc) / BuyPrc
                  const buyPrc = Number(String(item.buy_avg_pric || "0").replace(/,/g, ""));
                  if (buyPrc > 0 && sellPrc > 0) {
                    earningRate = ((sellPrc - buyPrc) / buyPrc) * 100;
                  }
                }
              }

              let perfStr = pnlNum > 0
                ? `+${pnlNum.toLocaleString()}`
                : pnlNum < 0
                  ? pnlNum.toLocaleString()
                  : `@${Number(String(item.sel_avg_pric ?? "0").replace(/,/g, "")).toLocaleString()}`;

              // Add rate of return in parentheses
              if (pnlNum !== 0) {
                perfStr = `${perfStr} (${earningRate.toFixed(2)}%)`;
              }

              mergedLogs.push(`${item.stk_nm}, ${perfStr}`);
              detailedLogs.push({
                name: item.stk_nm,
                pnlStr: perfStr,
                time: "------",
                side: "SELL",
              });
            });
        }

        // Asset value from kt00018
        if (evaluation && !evaluation.error) {
          const asset = Number(String(evaluation.prsm_dpst_aset_amt ?? "0").replace(/,/g, ""));
          totalAsset += asset;
        }
      } catch (err: any) {
        console.error(`[summary] Failed for ${acc.label}:`, err.message);
      }
    }

    return NextResponse.json({
      todayPnL: totalTodayPnL,
      tradeCount: detailedLogs.length,
      totalAsset,
      logs: mergedLogs.length > 0 ? mergedLogs.slice(0, 10) : ["NO RECENT TRADES"],
      detailedLogs,
    });
  } catch (error: any) {
    console.error("[summary] Aggregation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();
    if (!command) return NextResponse.json({ error: "No command" }, { status: 400 });

    const parts = command.toLowerCase().split(" ");
    const action = parts[0] as "buy" | "sell";
    const code = parts[1];
    const qty = parseInt(parts[2]);
    const price = parts[3] ? parseInt(parts[3]) : 0;

    if (!["buy", "sell"].includes(action) || !code || isNaN(qty)) {
      return NextResponse.json({ error: "Invalid format. Use: buy/sell <code> <qty> [price]" }, { status: 400 });
    }

    const accounts = KiwoomClient.getAccounts();
    if (accounts.length === 0) throw new Error("No accounts available");

    const result = await KiwoomClient.placeOrder(accounts[0], action, code, qty, price, price > 0 ? "limit" : "market");
    return NextResponse.json({ success: true, orderNo: result.ord_no, message: `Order executed: ${command}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
