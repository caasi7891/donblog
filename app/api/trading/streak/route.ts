import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";
import { subDays, isWeekend, format } from "date-fns";

// Memory cache
let cachedStreak: { value: number; timestamp: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 60 * 2; // 2 hours

/**
 * /api/trading/streak
 * Returns the winning streak (continuous earnings days).
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Check Cache
    const now = Date.now();
    if (cachedStreak && (now - cachedStreak.timestamp) < CACHE_DURATION) {
      return NextResponse.json({ streak: cachedStreak.value, cached: true });
    }

    const accounts = KiwoomClient.getAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({ streak: 0, error: "No accounts" });
    }
    const acc = accounts[0];

    // 2. Identify last 15-20 trading days
    const tradingDates: string[] = [];
    let datePointer = new Date();
    while (tradingDates.length < 15) {
      if (!isWeekend(datePointer)) {
        tradingDates.push(format(datePointer, "yyyyMMdd"));
      }
      datePointer = subDays(datePointer, 1);
    }

    // 3. Fetch sequentially or in small batches to respect Kiwoom rate limits
    // But for streak, we need them all or until first loss. 
    // We'll fetch the most recent 10 in parallel first to be fast.
    const recentBatch = tradingDates.slice(0, 10);
    const results = await Promise.all(
      recentBatch.map(date => KiwoomClient.getTradeHistory(acc, date))
    );

    // 4. Calculate Streak
    let streak = 0;
    for (let i = 0; i < results.length; i++) {
       const history = results[i];
       if (!history || history.error) break;

       const pnl = Number(String(history.tot_pl_amt ?? "0").replace(/,/g, ""));
       if (pnl > 0) {
         streak++;
       } else if (pnl < 0) {
         // Stop on loss
         break;
       }
    }

    // 5. Update Cache
    cachedStreak = { value: streak, timestamp: now };

    return NextResponse.json({ streak: streak, cached: false });
  } catch (error: any) {
    console.error("[streak] Calculation error:", error);
    return NextResponse.json({ streak: 0, error: error.message }, { status: 500 });
  }
}
