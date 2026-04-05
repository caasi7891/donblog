import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYYMMDD
    const accounts = KiwoomClient.getAccounts();

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No Kiwoom accounts configured" }, { status: 400 });
    }

    const accountPromises = accounts.map(async (acc) => {
      try {
        const [history, evaluation] = await Promise.all([
          KiwoomClient.getTradeHistory(acc, date || undefined),
          KiwoomClient.getAccountEvaluation(acc)
        ]);
        
        return {
          history,
          evaluation,
          label: acc.label
        };
      } catch (err: any) {
        console.error(`Failed to fetch for ${acc.label}:`, err.message);
        return null;
      }
    });

    const results = (await Promise.all(accountPromises)).filter((r): r is any => r !== null);

    // Aggregate data
    let totalTodayPnL = 0;
    let totalTradeCount = 0;
    let totalAsset = 0;
    let mergedLogs: string[] = [];

    for (const res of results) {
       if (!res || !res.history || res.history.error || res.history.authentication_failed_after_retry) {
         continue;
       }

       const accPnL = String(res.history.tot_pl_amt || "0").replace(/,/g, "");
       totalTodayPnL += Number(accPnL);

       const rawLogs = res.history.tdy_trde_diary || [];
       const tradeLogs = rawLogs.filter((item: any) => item.stk_nm && item.stk_nm.trim() !== "");
       totalTradeCount += tradeLogs.length;

       if (res.evaluation && !res.evaluation.error) {
         const accAsset = String(res.evaluation.prsm_dpst_aset_amt || "0").replace(/,/g, "");
         totalAsset += Number(accAsset);
       }

       // Format Logs: 'stock_name, income, trade_time'
       const formatted = tradeLogs.map((item: any) => {
         // Debug log for fields if they were missing before
         if (tradeLogs.indexOf(item) === 0) {
           console.log(`[DEBUG] Fields for ${item.stk_nm}:`, Object.keys(item));
           console.log(`[DEBUG] Raw trde_dtm: ${item.trde_dtm}, trde_tm: ${item.trde_tm}, stk_trde_tm: ${item.stk_trde_tm}`);
         }

         // Realized PnL field check (fallback for all common Kiwoom versions)
         const pnlRaw = item.tot_pl_amt || item.pl_amt || item.dnl_pl_amt || item.thdt_pl_amt || "0";
         const pnl = String(pnlRaw).replace(/,/g, "");
         const pnlNum = Number(pnl);
         const pnlStr = pnlNum > 0 ? `+${pnlNum.toLocaleString()}` : pnlNum.toLocaleString();

         // Time parsing - Looking for 6-digit selling time HHMMSS
         const fullTime = item.stk_trde_tm || item.trde_tm || item.trde_dtm || "";
         let timeStr = "";
         if (fullTime.length >= 14) {
           timeStr = fullTime.substring(8, 14); // Extract HHMMSS from YYYYMMDDHHMMSS
         } else if (fullTime.length >= 6) {
           timeStr = fullTime.substring(0, 6); // Already HHMMSS
         } else {
           timeStr = fullTime || "------"; // Fallback to whatever is there
         }

         return `${item.stk_nm}, ${pnlStr}, ${timeStr}`;
       });
       mergedLogs = [...mergedLogs, ...formatted];
    }

    return NextResponse.json({
      todayPnL: totalTodayPnL,
      tradeCount: totalTradeCount,
      totalAsset: totalAsset,
      logs: mergedLogs.length > 0 ? mergedLogs.slice(0, 10) : ["NO RECENT TRADES"],
    });
  } catch (error: any) {
    console.error("Trading Summary Aggregation Error:", error);
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
